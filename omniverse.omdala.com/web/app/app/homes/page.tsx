"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getProperties, createProperty, deleteProperty } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Property } from "@/lib/api";

export default function HomesPage() {
  const { token, user } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newType, setNewType] = useState("home");

  const { data, isLoading } = useQuery({
    queryKey: ["properties", user?.id],
    queryFn: () => getProperties(token!, user?.id),
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: (d: Parameters<typeof createProperty>[1]) =>
      createProperty(token!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      setShowCreate(false);
      setNewName("");
      setNewAddress("");
      toast.success("Home created!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProperty(token!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate({
      name: newName.trim(),
      address: newAddress.trim() || undefined,
      type: newType,
      ownerUserId: user!.id,
    });
  }

  const properties: Property[] = data?.properties ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Homes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your smart homes, offices, and venues.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Add home
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-5">
              Create new home
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Name *
                </label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My House"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Address
                </label>
                <input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="venue">Venue</option>
                  <option value="facility">Facility</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  {createMut.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && properties.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No homes yet
          </h2>
          <p className="text-gray-400 mb-6">
            Create your first home to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Create Home
          </button>
        </div>
      )}

      {/* Homes grid */}
      {!isLoading && properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">
                  {p.type === "office"
                    ? "🏢"
                    : p.type === "venue"
                      ? "🎪"
                      : p.type === "facility"
                        ? "🏭"
                        : "🏠"}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"?`)) deleteMut.mutate(p.id);
                  }}
                  className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                >
                  Delete
                </button>
              </div>
              <h3 className="font-semibold text-lg text-white mb-1">
                {p.name}
              </h3>
              {p.address && (
                <p className="text-gray-500 text-xs mb-4">{p.address}</p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                  {p.type ?? "home"}
                </span>
              </div>
              <Link
                href={`/app/homes/${p.id}`}
                className="block text-center bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white text-sm font-medium py-2 rounded-xl transition-colors"
              >
                Open dashboard →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
