import type { BilingualValue, OmdalaLanguage } from "./bilingual";

export const AUTH_ROLE_LABELS: Record<
  "expert" | "host" | "community" | "business" | "operator",
  BilingualValue
> = {
  expert: {
    en: "Expert",
    vi: "Chuyên gia",
  },
  host: {
    en: "Host",
    vi: "Chủ thể đón tiếp",
  },
  community: {
    en: "Community",
    vi: "Cộng đồng",
  },
  business: {
    en: "Business",
    vi: "Doanh nghiệp",
  },
  operator: {
    en: "Operator",
    vi: "Điều phối",
  },
};

export const AUTH_COPY = {
  authHostLoginPage: {
    eyebrow: {
      en: "OMDALA Auth",
      vi: "OMDALA Auth",
    },
    title: {
      en: "Secure login for OMDALA operator surfaces.",
      vi: "Đăng nhập an toàn cho các bề mặt vận hành của OMDALA.",
    },
    body: {
      en: "Continue with passwordless sign-in on the dedicated auth host. Session cookies are scoped for OMDALA subdomains.",
      vi: "Tiếp tục đăng nhập không mật khẩu trên host xác thực chuyên biệt. Cookie phiên được áp dụng cho toàn bộ subdomain của OMDALA.",
    },
    preparing: {
      en: "Preparing login...",
      vi: "Đang chuẩn bị đăng nhập...",
    },
    topology: {
      en: "Auth topology",
      vi: "Kiến trúc xác thực",
    },
    topologyItems: {
      host: {
        en: "Host: auth.omdala.com",
        vi: "Host: auth.omdala.com",
      },
      cookieDomain: {
        en: "Session cookie domain: .omdala.com",
        vi: "Miền cookie phiên: .omdala.com",
      },
      redirectChain: {
        en: "Redirect chain: app -> auth -> app",
        vi: "Chuỗi điều hướng: app -> auth -> app",
      },
      tokenVerification: {
        en: "Token verification via api.omdala.com",
        vi: "Xác minh token qua api.omdala.com",
      },
      exchange: {
        en: "Cookie exchange via /v1/auth/session/exchange",
        vi: "Trao đổi cookie qua /v1/auth/session/exchange",
      },
    },
  },
  appLoginPage: {
    eyebrow: {
      en: "Log In",
      vi: "Đăng nhập",
    },
    title: {
      en: "Continue on the dedicated OMDALA auth surface.",
      vi: "Tiếp tục trên bề mặt xác thực riêng của OMDALA.",
    },
    body: {
      en: "OMDALA now uses an isolated authentication host at auth.omdala.com with cookie-scoped session handling for all app subdomains.",
      vi: "OMDALA hiện dùng một host xác thực tách riêng tại auth.omdala.com, với cơ chế quản lý phiên bằng cookie cho toàn bộ các subdomain ứng dụng.",
    },
    sourceOfTruth: {
      en: "Source of truth",
      vi: "Nguồn dữ liệu chuẩn",
    },
    openAuth: {
      en: "Open auth.omdala.com",
      vi: "Mở auth.omdala.com",
    },
    topology: {
      en: "Auth topology",
      vi: "Kiến trúc xác thực",
    },
    sessionArchitecture: {
      en: "Session architecture",
      vi: "Kiến trúc phiên",
    },
    createAccount: {
      en: "Create account",
      vi: "Tạo tài khoản",
    },
    previewDashboard: {
      en: "Preview dashboard",
      vi: "Xem trước bảng điều khiển",
    },
    topologyItems: {
      entryHost: {
        en: "Entry host: auth.omdala.com",
        vi: "Host vào hệ: auth.omdala.com",
      },
      cookieDomain: {
        en: "Cookie domain: .omdala.com",
        vi: "Miền cookie: .omdala.com",
      },
      sessionValidation: {
        en: "App routes validate server session before unlock.",
        vi: "Các route ứng dụng kiểm tra phiên máy chủ trước khi mở khóa.",
      },
      exchangeEndpoint: {
        en: "Magic-link exchange is handled by API session endpoint.",
        vi: "Trao đổi liên kết đăng nhập được xử lý bởi endpoint phiên của API.",
      },
      localTokenFallback: {
        en: "App-local token handling is fallback only, not source of truth.",
        vi: "Việc giữ token cục bộ trong app chỉ là phương án dự phòng, không phải nguồn dữ liệu chuẩn.",
      },
    },
  },
  appSignupPage: {
    eyebrow: {
      en: "Create Account",
      vi: "Tạo tài khoản",
    },
    title: {
      en: "Start a new OMDALA operator account.",
      vi: "Bắt đầu một tài khoản vận hành OMDALA mới.",
    },
    body: {
      en: "The first account flow should stay lightweight and role-aware. This shell defines the minimum capture fields before backend auth and onboarding are connected.",
      vi: "Luồng tạo tài khoản đầu tiên cần giữ nhẹ và nhận biết rõ vai trò. Khung này xác định bộ trường tối thiểu trước khi lớp xác thực backend và onboarding được nối vào.",
    },
    onboardingRule: {
      en: "Onboarding rule",
      vi: "Nguyên tắc khởi tạo",
    },
    firstSessionGoals: {
      en: "First-session goals",
      vi: "Mục tiêu của phiên đầu tiên",
    },
    alreadyHasAccess: {
      en: "Already have access?",
      vi: "Bạn đã có quyền truy cập?",
    },
    goals: {
      submitRequest: {
        en: "Submit access request to app intake endpoint.",
        vi: "Gửi yêu cầu truy cập vào endpoint intake của ứng dụng.",
      },
      chooseRole: {
        en: "Choose the primary role for bootstrap context.",
        vi: "Chọn vai trò chính cho bối cảnh bootstrap.",
      },
      seedNode: {
        en: "Seed the first node and ownership boundary.",
        vi: "Gieo nút đầu tiên và ranh giới sở hữu.",
      },
      firstAction: {
        en: "Route operator into first meaningful dashboard action.",
        vi: "Đưa người vận hành vào hành động bảng điều khiển đầu tiên có ý nghĩa.",
      },
    },
  },
  magicLinkForm: {
    verifying: {
      en: "Verifying your sign-in link...",
      vi: "Đang xác thực liên kết đăng nhập...",
    },
    verifyError: {
      en: "Unable to verify your sign-in link.",
      vi: "Không thể xác thực liên kết đăng nhập.",
    },
    verified: {
      en: "Sign-in link accepted. Redirecting into the app...",
      vi: "Liên kết đăng nhập hợp lệ. Đang chuyển vào ứng dụng...",
    },
    invalidLink: {
      en: "The sign-in link is invalid or expired.",
      vi: "Liên kết đăng nhập không hợp lệ hoặc đã hết hạn.",
    },
    sending: {
      en: "Sending your sign-in link...",
      vi: "Đang gửi liên kết đăng nhập...",
    },
    sendError: {
      en: "Unable to send your sign-in link.",
      vi: "Không gửi được liên kết đăng nhập.",
    },
    genericSendError: {
      en: "Unable to send the sign-in link.",
      vi: "Không gửi được liên kết đăng nhập.",
    },
    email: {
      en: "Work email",
      vi: "Email công việc",
    },
    redirect: {
      en: "Redirect after sign-in",
      vi: "Điều hướng sau đăng nhập",
    },
    sendingShort: {
      en: "Sending...",
      vi: "Đang gửi...",
    },
    send: {
      en: "Send sign-in link",
      vi: "Gửi liên kết đăng nhập",
    },
    loginEmail: {
      en: "Login email comes from ",
      vi: "Email đăng nhập được gửi từ ",
    },
    support: {
      en: "For support, reply via ",
      vi: "Nếu cần hỗ trợ, phản hồi qua ",
    },
  },
  accessRequestForm: {
    sending: {
      en: "Sending your access request...",
      vi: "Đang gửi yêu cầu truy cập...",
    },
    sendError: {
      en: "Unable to submit the access request.",
      vi: "Không gửi được yêu cầu truy cập.",
    },
    genericSendError: {
      en: "Unable to submit the access request.",
      vi: "Không gửi được yêu cầu truy cập.",
    },
    email: {
      en: "Work email",
      vi: "Email công việc",
    },
    role: {
      en: "Primary role",
      vi: "Vai trò chính",
    },
    nodeName: {
      en: "First node name",
      vi: "Tên nút đầu tiên",
    },
    nodePlaceholder: {
      en: "Your node or organization name",
      vi: "Tên nút hoặc tổ chức của bạn",
    },
    note: {
      en: "Context note",
      vi: "Ghi chú bối cảnh",
    },
    notePlaceholder: {
      en: "What you are building, coordinating, or exploring.",
      vi: "Bạn đang xây dựng, điều phối hoặc khám phá điều gì?",
    },
    sendingShort: {
      en: "Sending...",
      vi: "Đang gửi...",
    },
    submit: {
      en: "Create draft account",
      vi: "Tạo yêu cầu truy cập",
    },
    intake: {
      en: "Access intake is sent to ",
      vi: "Yêu cầu truy cập được gửi tới ",
    },
    support: {
      en: "Support follows through ",
      vi: "Hỗ trợ theo dõi qua ",
    },
  },
} as const;

export function getMagicLinkSentMessage(fromInbox: string): BilingualValue {
  return {
    en: `Your sign-in link has been sent from ${fromInbox}.`,
    vi: `Liên kết đăng nhập đã được gửi từ ${fromInbox}.`,
  };
}

export function getAccessRequestReceivedMessage(appInbox: string): BilingualValue {
  return {
    en: `Request received. The team will reply from ${appInbox}.`,
    vi: `Đã gửi yêu cầu. Đội ngũ sẽ phản hồi từ ${appInbox}.`,
  };
}

export function getFallbackLanguageRoleLabel(
  role: keyof typeof AUTH_ROLE_LABELS,
  language: OmdalaLanguage,
): string {
  return language === "vi"
    ? AUTH_ROLE_LABELS[role].vi
    : AUTH_ROLE_LABELS[role].en;
}
