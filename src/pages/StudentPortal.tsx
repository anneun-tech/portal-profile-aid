import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { AlertCircle, Edit, CheckCircle } from "lucide-react";
import { z } from "zod";

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  branch: z.string().trim().min(1, "Branch is required").max(100, "Branch must be less than 100 characters"),
  year: z.number().int().min(1, "Year must be between 1 and 5").max(5, "Year must be between 1 and 5"),
  address: z.string().trim().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  phone_number: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  parents_phone_number: z.string().regex(/^[0-9]{10}$/, "Parent's phone number must be exactly 10 digits"),
  aadhaar_number: z.string().regex(/^[0-9]{12}$/, "Aadhaar must be exactly 12 digits").optional().or(z.literal("")),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format must be: ABCDE1234F").optional().or(z.literal("")),
  account_number: z.string().trim().min(8, "Account number must be at least 8 characters").max(20, "Account number must be less than 20 characters"),
}).refine(
  (data) => data.aadhaar_number || data.pan_number,
  { message: "Either Aadhaar or PAN number must be provided", path: ["aadhaar_number"] }
);

const StudentPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    branch: "",
    year: 0,
    address: "",
    phone_number: "",
    parents_phone_number: "",
    aadhaar_number: "",
    pan_number: "",
    account_number: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    checkAdmin();
    fetchStudentData();
  }, [user, navigate]);

  const checkAdmin = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const fetchStudentData = async () => {
    if (!user) return;

    // Use RPC function to get decrypted student data
    const { data: students } = await supabase
      .rpc("get_student_decrypted", { p_user_id: user.id });

    const student = students && students.length > 0 ? students[0] : null;
    setStudentData(student);

    if (student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        branch: student.branch || "",
        year: student.year || 0,
        address: student.address || "",
        phone_number: student.phone_number || "",
        parents_phone_number: student.parents_phone_number || "",
        aadhaar_number: student.aadhaar_number || "",
        pan_number: student.pan_number || "",
        account_number: student.account_number || "",
      });
    } else {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
      }));
    }
  };

  const isProfileIncomplete = () => {
    const requiredFields = [
      'name', 'email', 'branch', 'year', 'address', 
      'phone_number', 'parents_phone_number'
    ];
    
    const hasAadhaarOrPan = formData.aadhaar_number || formData.pan_number;
    
    const missingRequired = requiredFields.some(field => !formData[field as keyof typeof formData]);
    const missingAccountNumber = !formData.account_number;
    
    return missingRequired || !hasAadhaarOrPan || missingAccountNumber;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Validate form data
      const validationResult = studentSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (studentData) {
        // Use RPC function to update with encryption
        const { error } = await supabase.rpc("update_student_encrypted", {
          p_user_id: user.id,
          p_name: formData.name,
          p_email: formData.email,
          p_branch: formData.branch || null,
          p_year: formData.year || null,
          p_address: formData.address || null,
          p_phone_number: formData.phone_number || null,
          p_parents_phone_number: formData.parents_phone_number || null,
          p_aadhaar_number: formData.aadhaar_number || null,
          p_pan_number: formData.pan_number || null,
          p_account_number: formData.account_number || null,
        });

        if (error) throw error;

        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        // Use RPC function to insert with encryption
        const { error } = await supabase.rpc("insert_student_encrypted", {
          p_user_id: user.id,
          p_name: formData.name,
          p_email: formData.email,
          p_branch: formData.branch || null,
          p_year: formData.year || null,
          p_address: formData.address || null,
          p_phone_number: formData.phone_number || null,
          p_parents_phone_number: formData.parents_phone_number || null,
          p_aadhaar_number: formData.aadhaar_number || null,
          p_pan_number: formData.pan_number || null,
          p_account_number: formData.account_number || null,
        });

        if (error) throw error;

        toast({
          title: "Profile Created",
          description: "Your profile has been created successfully.",
        });
      }

      await fetchStudentData();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentData !== null && isProfileIncomplete()) {
      setIsEditing(true);
    }
  }, [studentData]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} isAdmin={isAdmin} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Portal</h1>
          <p className="text-muted-foreground">Manage your profile and personal information</p>
        </div>

        {isProfileIncomplete() && !isEditing && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-warning mb-1">Profile Incomplete</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please complete your profile to access all features.
                  </p>
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              My Profile
              {!isProfileIncomplete() && (
                <CheckCircle className="h-5 w-5 text-success" />
              )}
            </CardTitle>
            {!isEditing && !isProfileIncomplete() && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch *</Label>
                    <Input
                      id="branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year || ""}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parents_phone_number">Parent's Phone Number *</Label>
                    <Input
                      id="parents_phone_number"
                      value={formData.parents_phone_number}
                      onChange={(e) => setFormData({ ...formData, parents_phone_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                    <Input
                      id="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input
                      id="pan_number"
                      value={formData.pan_number}
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="account_number">Account Number *</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  * Required fields | You must provide either Aadhaar or PAN number
                </p>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                  {!isProfileIncomplete() && (
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{formData.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{formData.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-medium">{formData.branch || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{formData.year ? formData.year.toString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{formData.phone_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parent's Phone Number</p>
                    <p className="font-medium">{formData.parents_phone_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aadhaar Number</p>
                    <p className="font-medium">{formData.aadhaar_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PAN Number</p>
                    <p className="font-medium">{formData.pan_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">{formData.account_number || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{formData.address || "—"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentPortal;
