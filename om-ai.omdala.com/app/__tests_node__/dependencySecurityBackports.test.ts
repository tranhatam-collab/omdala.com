import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  convertCSRPEMToCSR,
  convertCSRToCSRPEM,
  convertCertificatePEMToCertificate,
  convertCertificateToCertificatePEM,
  generateCSR,
  generateDevelopmentCertificateFromCSR,
  generateKeyPair,
  generateSelfSignedCodeSigningCertificate,
  signBufferRSASHA256AndVerify,
  validateSelfSignedCertificate,
} from '@expo/code-signing-certificates';
import braces from 'braces';
import micromatch from 'micromatch';
import forge from 'node-forge';

type BackportEntry = {
  name: string;
  internal_fork_version: string;
  patch_file: string;
  patch_sha256: string;
  vendored_tree: string;
  vendored_tree_bytes: number;
  vendored_tree_files: number;
  vendored_tree_sha256: string;
};

type AstNode = {
  type: string;
  value?: string;
  nodes?: AstNode[];
  parent?: AstNode;
};

const appRoot = process.cwd();
const vendorRoot = path.join(appRoot, 'vendor');

function listFiles(root: string, directory = ''): string[] {
  const absoluteDirectory = path.join(root, directory);
  const files: string[] = [];
  for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const relativePath = directory ? directory + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFiles(root, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

function treeReceipt(root: string) {
  const files = listFiles(root);
  const hash = createHash('sha256');
  let bytes = 0;
  for (const relativePath of files) {
    const contents = readFileSync(path.join(root, relativePath));
    bytes += contents.byteLength;
    hash.update(relativePath);
    hash.update('\0');
    hash.update(contents);
    hash.update('\0');
  }
  return { bytes, files: files.length, sha256: hash.digest('hex') };
}

function deepAst(depth: number): AstNode {
  let node: AstNode = { type: 'text', value: 'a' };
  for (let index = 0; index < depth; index += 1) {
    node = { type: 'brace', nodes: [node] };
  }
  return { type: 'root', nodes: [node] };
}

test('vendored security backports match complete-tree and exact-patch receipts', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(vendorRoot, 'SECURITY_BACKPORTS.json'), 'utf8'),
  ) as {
    packages: BackportEntry[];
    non_vendored_advisories: Array<{
      advisory: string;
      installed: boolean;
      name: string;
      severity: string;
    }>;
  };

  assert.equal(manifest.packages.length, 2);
  for (const entry of manifest.packages) {
    const patchDigest = createHash('sha256')
      .update(readFileSync(path.join(vendorRoot, entry.patch_file)))
      .digest('hex');
    assert.equal(patchDigest, entry.patch_sha256, entry.name + ' patch');

    const packageRoot = path.join(vendorRoot, entry.vendored_tree);
    assert.deepEqual(treeReceipt(packageRoot), {
      bytes: entry.vendored_tree_bytes,
      files: entry.vendored_tree_files,
      sha256: entry.vendored_tree_sha256,
    });

    const packageJson = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
      version: string;
    };
    assert.equal(packageJson.version, entry.internal_fork_version);
    assert.match(packageJson.version, /\+omdala\./u);
  }

  assert.equal(manifest.non_vendored_advisories.length, 1);
  assert.deepEqual(
    {
      advisory: manifest.non_vendored_advisories[0].advisory,
      installed: manifest.non_vendored_advisories[0].installed,
      name: manifest.non_vendored_advisories[0].name,
      severity: manifest.non_vendored_advisories[0].severity,
    },
    {
      advisory: 'GHSA-hp3w-g68c-fv3c',
      installed: false,
      name: 'sprintf-js',
      severity: 'moderate',
    },
  );
  const lock = JSON.parse(readFileSync(path.join(appRoot, 'package-lock.json'), 'utf8')) as {
    packages: Record<string, unknown>;
  };
  assert.equal(
    Object.keys(lock.packages).some(packagePath => packagePath.endsWith('/sprintf-js')),
    false,
  );
  assert.equal(existsSync(path.join(vendorRoot, 'node-forge', 'dist')), false);
  assert.equal(existsSync(path.join(vendorRoot, 'node-forge', 'flash')), false);
});

test('braces PR 72 guards all public recursive paths at 100/101 boundaries', () => {
  const methods = [
    ['parse', braces.parse],
    ['compile', braces.compile],
    ['expand', braces.expand],
    ['stringify', braces.stringify],
  ] as const;

  for (const [name, method] of methods) {
    for (const pair of [
      ['{'.repeat(100) + 'a' + '}'.repeat(100), '{'.repeat(101) + 'a' + '}'.repeat(101)],
      ['('.repeat(100) + 'a' + ')'.repeat(100), '('.repeat(101) + 'a' + ')'.repeat(101)],
    ]) {
      assert.doesNotThrow(() => method(pair[0]), name + ' depth 100');
      assert.throws(() => method(pair[1]), /exceeds max depth/u, name + ' depth 101');
    }
  }

  assert.doesNotThrow(() => braces.parse('{a,b}', { maxDepth: 1.5 }));
  assert.throws(() => braces.parse('{{a,b},c}', { maxDepth: 1.5 }), /exceeds max depth/u);
  assert.doesNotThrow(() => braces.parse('(a)', { maxDepth: 1.5 }));
  assert.throws(() => braces.parse('((a))', { maxDepth: 1.5 }), /exceeds max depth/u);
  assert.throws(
    () => braces.parse('{'.repeat(101) + 'a' + '}'.repeat(101), { maxDepth: 10_000 }),
    /exceeds max depth/u,
  );
});

test('braces PR 72 guards deep and cyclic caller-supplied ASTs', () => {
  const astMethods = [
    ['compile', braces.compile],
    ['expand', braces.expand],
    ['stringify', braces.stringify],
  ] as const;

  for (const [name, method] of astMethods) {
    assert.doesNotThrow(() => method(deepAst(100)), name + ' AST depth 100');
    assert.throws(() => method(deepAst(101)), /exceeds max depth/u, name + ' AST depth 101');

    const nodeCycle: AstNode = { type: 'brace', nodes: [] };
    nodeCycle.nodes = [nodeCycle];
    assert.throws(
      () => method({ type: 'root', nodes: [nodeCycle] }),
      /exceeds max depth/u,
      name + ' node cycle',
    );
  }

  const selfParent: AstNode = { type: 'paren', nodes: [{ type: 'text', value: 'a' }] };
  selfParent.parent = selfParent;
  assert.throws(() => braces.expand(selfParent), /parent chain contains a cycle/u);

  const first: AstNode = { type: 'paren', nodes: [{ type: 'text', value: 'a' }] };
  const second: AstNode = { type: 'paren' };
  first.parent = second;
  second.parent = first;
  assert.throws(() => braces.expand(first), /parent chain contains a cycle/u);
});

test('braces preserves stringify and Metro micromatch controls', () => {
  for (const pattern of ['{{a}}', '{a,{b}}', '{{x}y}', '{a,{b,{c}}', '{}{a}']) {
    assert.equal(braces.stringify(braces.parse(pattern), { escapeInvalid: true }), pattern);
  }
  assert.deepEqual(braces('a/{b,c}/d'), ['a/(b|c)/d']);
  assert.deepEqual(braces.expand('a/{b,c}/d'), ['a/b/d', 'a/c/d']);
  assert.deepEqual(
    micromatch(
      ['src/App.tsx', 'src/App.test.tsx', 'src/util.ts', 'node_modules/x.js'],
      ['src/**/*.{ts,tsx}', '!**/*.test.*'],
    ),
    ['src/App.tsx', 'src/util.ts'],
  );
});

test('node-forge rejects the exact PR 1152 forged-signature vector', () => {
  const modulus = new forge.jsbn.BigInteger(
    'E932AC92252F585B3A80A4DD76A897C8B7652952FE788F6EC8DD640587A1EE56' +
      '47670A8AD4C2BE0F9FA6E49C605ADF77B5174230AF7BD50E5D6D6D6D28CCF0A8' +
      '86A514CC72E51D209CC772A52EF419F6A953F3135929588EBE9B351FCA61CED7' +
      '8F346FE00DBB6306E5C2A4C6DFC3779AF85AB417371CF34D8387B9B30AE46D7A' +
      '5FF5A655B8D8455F1B94AE736989D60A6F2FD5CADBFFBD504C5A756A2E6BB5CE' +
      'CC13BCA7503F6DF8B52ACE5C410997E98809DB4DC30D943DE4E812A47553DCE5' +
      '4844A78E36401D13F77DC650619FED88D8B3926E3D8E319C80C744779AC5D6AB' +
      'E252896950917476ECE5E8FC27D5F053D6018D91B502C4787558A002B9283DA7',
    16,
  );
  const publicKey = forge.pki.rsa.setPublicKey(modulus, new forge.jsbn.BigInteger('3'));
  const forgedEncodedMessageHex =
    '0001ffffffffffffffff003081f23081cd060960864801650304020105000481bd88' +
    '88888888888888888888888888888888888888888888888888888888888888888888' +
    '88888888888888888888888888888888888888888888888888888888888888888888' +
    '88888888888888888888888888888888888888888888888888888888888888888888' +
    '88888888888888888888888888888888888888888888888888888888888888888888' +
    '88888888888888888888888888888888888888888888888888888888888888888888' +
    '88888888888888888888888888888888888804207509e5bda0c762d2bac7f90d758b' +
    '5b2263fa01ccbc542ab5e3df163be08e6ca9';
  const forgedSignature = forge.util.hexToBytes(
    'a4ae63dd5e7712b78f4870d0f51e294df5503d4f16c5d27ae33370981fb57f0de49f' +
      '50f3d6a04666774cd984cd13972db9bf8e12bd294ef0ddc916c7c86cbae63efd7b6b' +
      '97885e69760c208a40f1aecc76a90d7af5145177efce1bb55807a8d05c20b1596753' +
      'ba710642fc9acdde6c160232654662c77cc4466c8257a38edb49f894e8845d0fd987' +
      'b857ced88f4b62505a080bd87ef700d35d392a6e8f6fde34250c50b86fae606cb551' +
      '215e8f4813239b77651d5565ad453698c071d48c31e8e526fb4a37610f64b3e1fb8e' +
      '5be5898e408ad08197a0947794a530b54f84485377ce4a7488ed485ce4e5e105dd89' +
      '698a472f390c3b1b76bc16b73276c4d1c81d',
  );

  assert.equal(
    forge.util.bytesToHex(publicKey.encrypt(forgedSignature, 'RAW')),
    forgedEncodedMessageHex,
  );
  const forgedDigest = forge.md.sha256.create();
  forgedDigest.update('hello world!');
  assert.throws(
    () =>
      publicKey.verify(forgedDigest.digest().getBytes(), forgedSignature, undefined, {
        _parseAllDigestBytes: true,
        _skipPaddingChecks: true,
      }),
    /valid RSASSA-PKCS1-v1_5 DigestInfo/u,
  );
});

test('node-forge accepts valid RSA signing controls', () => {
  const pair = forge.pki.rsa.generateKeyPair({ bits: 512, e: 0x10001 });
  const signingDigest = forge.md.sha256.create();
  signingDigest.update('valid control');
  const signature = pair.privateKey.sign(signingDigest);
  const verificationDigest = forge.md.sha256.create();
  verificationDigest.update('valid control');
  assert.equal(pair.publicKey.verify(verificationDigest.digest().getBytes(), signature), true);
});

test('Expo certificate, CSR, and manifest-signing flows use the patched node-forge', () => {
  const issuerKeyPair = generateKeyPair();
  const validityNotBefore = new Date(Date.now() - 60_000);
  const validityNotAfter = new Date(Date.now() + 86_400_000);
  const issuerCertificate = generateSelfSignedCodeSigningCertificate({
    keyPair: issuerKeyPair,
    validityNotBefore,
    validityNotAfter,
    commonName: 'Omdala Expo signing test',
  });

  assert.doesNotThrow(() => validateSelfSignedCertificate(issuerCertificate, issuerKeyPair));
  const certificateRoundTrip = convertCertificatePEMToCertificate(
    convertCertificateToCertificatePEM(issuerCertificate),
  );
  assert.equal(certificateRoundTrip.verify(certificateRoundTrip), true);
  assert.match(
    signBufferRSASHA256AndVerify(
      issuerKeyPair.privateKey,
      certificateRoundTrip,
      Buffer.from('omdala-expo-manifest', 'utf8'),
    ),
    /^[A-Za-z0-9+/]+={0,2}$/u,
  );

  const developmentKeyPair = generateKeyPair();
  const csr = convertCSRPEMToCSR(
    convertCSRToCSRPEM(generateCSR(developmentKeyPair, 'Omdala development signer')),
  );
  const developmentCertificate = generateDevelopmentCertificateFromCSR(
    issuerKeyPair.privateKey,
    issuerCertificate,
    csr,
    'omdala-com',
    'omdala-mobile',
  );
  assert.equal(issuerCertificate.verify(developmentCertificate), true);
  assert.equal(developmentCertificate.getExtension('extKeyUsage').codeSigning, true);
});
