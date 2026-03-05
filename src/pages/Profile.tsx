import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Shield, Camera } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { user, profile, role, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [avatarUploading, setAvatarUploading] = useState(false);

  const roleLabel = role === "admin" ? "Admin" : role === "analyst" ? "Analyst" : "Credit Officer";

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleProfileSave = async () => {
    setProfileErrors({});
    const result = profileSchema.safeParse({ full_name: fullName });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setProfileErrors(errs);
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: result.data.full_name })
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    }
    setSavingProfile(false);
  };

  const handlePasswordChange = async () => {
    setPasswordErrors({});
    const result = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setPasswordErrors(errs);
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be under 2MB.", variant: "destructive" });
      return;
    }

    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      toast({ title: "Error", description: "Failed to save avatar.", variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Avatar updated", description: "Your profile photo has been changed." });
    }
    setAvatarUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* Avatar & Identity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profile Information
          </CardTitle>
          <CardDescription>Update your name and profile photo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">{initials}</span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-5 w-5 text-background" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{avatarUploading ? "Uploading…" : "Click photo to change"}</p>
            </div>
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" maxLength={100} />
            {profileErrors.full_name && <p className="text-xs text-destructive">{profileErrors.full_name}</p>}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input id="email" value={user?.email ?? ""} disabled className="bg-muted" />
            <p className="text-[10px] text-muted-foreground">Email cannot be changed from here</p>
          </div>

          {/* Role (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Role
            </Label>
            <Input value={roleLabel} disabled className="bg-muted" />
          </div>

          <Button onClick={handleProfileSave} disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" />
            {passwordErrors.newPassword && <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
            {passwordErrors.confirmPassword && <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>}
          </div>
          <Button variant="outline" onClick={handlePasswordChange} disabled={savingPassword}>
            {savingPassword ? "Updating…" : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
