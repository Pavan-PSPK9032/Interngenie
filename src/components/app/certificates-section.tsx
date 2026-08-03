"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Plus, Loader2, Trash2, Shield, ExternalLink, Globe, X,
  Check, FileText,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Cert {
  id: string;
  name: string;
  organization: string;
  category: string;
  issueDate: string;
  expiryDate?: string;
  credentialId: string;
  verificationLink: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  isPublic: boolean;
  description: string;
  skills: string[];
}

const CATEGORIES = ["Programming", "AI", "Cloud", "Cybersecurity", "Data Science", "Web Development", "Other"];
const FILE_TYPES = ["pdf", "png", "jpeg", "jpg"];

const emptyForm = {
  name: "",
  organization: "",
  category: "Programming",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  verificationLink: "",
  fileUrl: "",
  fileName: "",
  fileType: "pdf",
  isPublic: true,
  description: "",
  skillsText: "",
};

export function CertificatesSection() {
  const { token, pushToast } = useApp();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const res = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      return (await res.json()).certificates as Cert[];
    },
    enabled: !!token,
  });

  const certs = data || [];

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (c: Cert) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      organization: c.organization,
      category: c.category,
      issueDate: c.issueDate ? c.issueDate.slice(0, 10) : "",
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : "",
      credentialId: c.credentialId || "",
      verificationLink: c.verificationLink || "",
      fileUrl: c.fileUrl || "",
      fileName: c.fileName || "",
      fileType: c.fileType || "pdf",
      isPublic: c.isPublic,
      description: c.description || "",
      skillsText: (c.skills || []).join(", "),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.organization.trim()) {
      pushToast({ title: "Missing fields", message: "Name and organization are required", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        skills: form.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      };
      delete (body as any).skillsText;

      const res = await fetch(
        editingId ? `/api/certificates/${editingId}` : "/api/certificates",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      );
      const data2 = await res.json();
      if (!res.ok) {
        pushToast({ title: "Save failed", message: data2.error, type: "error" });
        return;
      }
      pushToast({ title: editingId ? "Certificate updated" : "Certificate added", type: "success" });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["profile-completeness"] });
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        pushToast({ title: "Certificate deleted", type: "success" });
        queryClient.invalidateQueries({ queryKey: ["certificates"] });
        queryClient.invalidateQueries({ queryKey: ["profile-completeness"] });
      } else {
        pushToast({ title: "Delete failed", type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublic = async (c: Cert) => {
    try {
      const res = await fetch(`/api/certificates/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPublic: !c.isPublic }),
      });
      if (res.ok) {
        pushToast({ title: c.isPublic ? "Certificate set to private" : "Certificate is now public", type: "success" });
        queryClient.invalidateQueries({ queryKey: ["certificates"] });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Certificates
            <Badge variant="secondary" className="text-[10px]">{certs.length}</Badge>
          </h2>
          <Button size="sm" onClick={startAdd} className="gradient-emerald text-white gap-1.5">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Add certificates, courses, and credentials to showcase on your public profile.
        </p>

        {/* Add / edit form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {editingId ? "Edit Certificate" : "New Certificate"}
                  </p>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Certificate Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Meta Front-End Developer"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Issuing Organization *</Label>
                    <Input
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      placeholder="Coursera"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">File Type</Label>
                    <select
                      value={form.fileType}
                      onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {FILE_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Issue Date</Label>
                    <Input
                      type="date"
                      value={form.issueDate}
                      onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Expiry Date (optional)</Label>
                    <Input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Credential ID</Label>
                    <Input
                      value={form.credentialId}
                      onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
                      placeholder="e.g., ABC123XYZ"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Verification Link</Label>
                    <Input
                      value={form.verificationLink}
                      onChange={(e) => setForm({ ...form, verificationLink: e.target.value })}
                      placeholder="https://verify.coursera.org/..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Certificate File URL</Label>
                    <Input
                      value={form.fileUrl}
                      onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                      placeholder="https://.../certificate.pdf"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Skills (comma separated)</Label>
                    <Input
                      value={form.skillsText}
                      onChange={(e) => setForm({ ...form, skillsText: e.target.value })}
                      placeholder="React, JavaScript, UI Design"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description of what you learned..."
                      className="min-h-[60px] resize-none text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                      className={cn(
                        "flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 border transition-all",
                        form.isPublic
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      <span className={cn(
                        "relative w-8 h-4 rounded-full transition-colors",
                        form.isPublic ? "bg-emerald-500" : "bg-muted"
                      )}>
                        <span className={cn(
                          "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                          form.isPublic ? "left-4.5" : "left-0.5"
                        )} />
                      </span>
                      {form.isPublic ? "Visible on public profile" : "Private"}
                    </button>
                    <Button onClick={save} disabled={saving} className="gradient-emerald text-white gap-1.5 h-9">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editingId ? "Update" : "Save Certificate"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading certificates...
          </div>
        ) : certs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Award className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No certificates yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add your certifications and courses to boost your profile
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certs.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-border/40 bg-card/30 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg gradient-emerald flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.organization}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePublic(c)}
                    title={c.isPublic ? "Make private" : "Make public"}
                    className={cn(
                      "shrink-0 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border transition-colors",
                      c.isPublic
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    <Globe className="w-3 h-3" />
                    {c.isPublic ? "Public" : "Private"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">{c.category}</Badge>
                  {c.issueDate && <span>{new Date(c.issueDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>}
                </div>

                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {c.verificationLink && (
                    <a
                      href={c.verificationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" /> Verify
                    </a>
                  )}
                  {c.fileUrl && (
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View file
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => startEdit(c)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-destructive"
                    onClick={() => remove(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
