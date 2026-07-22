"use client";
import { motion } from "framer-motion";
import { Users, Shield, Trash2, CheckCircle2, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminUsers() {
  const { user, token, pushToast } = useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user && user.role === "ADMIN",
  });

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        pushToast({ title: "User deleted", type: "warning" });
      }
    } catch {}
  };

  const users = (data?.users || []).filter((u: any) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Manage Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users.length} users · Monitor and manage all platform accounts
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-9 max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground bg-muted/30">
                  <th className="text-left font-medium py-3 px-4">User</th>
                  <th className="text-left font-medium py-3 px-4 hidden md:table-cell">Role</th>
                  <th className="text-left font-medium py-3 px-4 hidden lg:table-cell">Institution</th>
                  <th className="text-left font-medium py-3 px-4 hidden sm:table-cell">Profile</th>
                  <th className="text-left font-medium py-3 px-4">Status</th>
                  <th className="text-right font-medium py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u: any, i: number) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="border-b border-border/40 text-sm hover:bg-accent/30"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-9 h-9 gradient-emerald">
                            <AvatarFallback className="text-white text-xs">
                              {u.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <Badge variant="secondary" className="text-[10px]">{u.role}</Badge>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                        {u.college || "—"}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs">{u.profileCompleted}%</span>
                      </td>
                      <td className="py-3 px-4">
                        {u.isApproved ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== "ADMIN" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {u.name} and all their data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser(u.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {u.role === "ADMIN" && (
                          <Shield className="w-4 h-4 text-primary inline" />
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
