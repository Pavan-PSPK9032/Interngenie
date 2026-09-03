"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Save, Globe, MapPin, Menu, Check, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MyCompany {
  id: string;
  name: string;
  email: string;
  industry?: string;
  description?: string;
  website?: string;
  location?: string;
  size?: string;
  status?: string;
  verified?: boolean;
  approved?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  rating?: number;
}

export function CompanyProfile() {
  const { token, pushToast } = useApp();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-company"],
    queryFn: async () => {
      const res = await fetch("/api/companies/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load company");
      return res.json();
    },
    enabled: !!token,
  });

  const company: MyCompany | undefined = data?.company;

  const [form, setForm] = useState<Record<string, string>>({});

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const update = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/companies/mine", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-company"] });
      pushToast({ title: "Company profile updated", type: "success" });
    },
    onError: () => pushToast({ title: "Update failed", type: "error" }),
  });

  const save = () => {
    if (Object.keys(form).length === 0) {
      pushToast({ title: "No changes to save", type: "info" });
      return;
    }
    setSaving(true);
    update.mutate(undefined, { onSettled: () => setSaving(false) });
  };

  const statusStyle =
    company?.status === "SUSPENDED"
      ? "bg-red-500/10 text-red-700 dark:text-red-400"
      : company?.status === "PENDING"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : company?.status === "REJECTED"
      ? "bg-red-500/10 text-red-700 dark:text-red-400"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Company Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your public company information
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 shimmer rounded-2xl" />)}
        </div>
      ) : !company ? (
        <Card>
          <CardContent className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">Company not found</p>
            <p className="text-sm text-muted-foreground">
              Your account is not linked to a company profile. Contact a platform admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="gradient-emerald h-24" />
            <CardContent className="p-6 -mt-12">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-premium flex items-center justify-center border">
                  <Building2 className="w-9 h-9 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{company.name}</h2>
                    <Badge className={cn("text-[10px]", statusStyle)}>{company.status || "APPROVED"}</Badge>
                    {company.verified && (
                      <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {company.email} {company.industry ? `· ${company.industry}` : ""}
                  </p>
                </div>
              </div>
              {company.rejectionReason && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                  <strong>Status note:</strong> {company.rejectionReason}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Menu className="w-4 h-4 text-primary" /> Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="cp-description">Description</Label>
                <Textarea
                  id="cp-description"
                  rows={3}
                  className="mt-1"
                  defaultValue={company.description || ""}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cp-industry">Industry</Label>
                <Input id="cp-industry" className="mt-1" defaultValue={company.industry || ""} onChange={(e) => setField("industry", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cp-size">Company Size</Label>
                <Input id="cp-size" className="mt-1" placeholder="e.g. 50-200" defaultValue={company.size || ""} onChange={(e) => setField("size", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="cp-location"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />Location</span></Label>
                <Input id="cp-location" className="mt-1" defaultValue={company.location || ""} onChange={(e) => setField("location", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="cp-website"><span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" />Website</span></Label>
                <Input id="cp-website" className="mt-1" placeholder="https://" defaultValue={company.website || ""} onChange={(e) => setField("website", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Contact & Social
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cp-contact-email">Contact Email</Label>
                <Input id="cp-contact-email" type="email" className="mt-1" defaultValue={company.contactEmail || ""} onChange={(e) => setField("contactEmail", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cp-contact-phone">Contact Phone</Label>
                <Input id="cp-contact-phone" className="mt-1" defaultValue={company.contactPhone || ""} onChange={(e) => setField("contactPhone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cp-linkedin">LinkedIn</Label>
                <Input id="cp-linkedin" className="mt-1" defaultValue={company.linkedin || ""} onChange={(e) => setField("linkedin", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cp-twitter">Twitter / X</Label>
                <Input id="cp-twitter" className="mt-1" defaultValue={company.twitter || ""} onChange={(e) => setField("twitter", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cp-facebook">Facebook</Label>
                <Input id="cp-facebook" className="mt-1" defaultValue={company.facebook || ""} onChange={(e) => setField("facebook", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 sticky bottom-4">
            <Button onClick={save} disabled={saving} className="gradient-emerald text-white gap-2 ml-auto">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
