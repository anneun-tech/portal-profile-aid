import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { z } from "zod";

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  branch: z.string().trim().max(100, "Branch must be less than 100 characters").optional(),
  year: z.string().refine(val => !val || (parseInt(val) >= 1 && parseInt(val) <= 5), "Year must be between 1 and 5").optional(),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional(),
  phone_number: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
  parents_phone_number: z.string().regex(/^[0-9]{10}$/, "Parent's phone number must be exactly 10 digits").optional().or(z.literal("")),
  aadhaar_number: z.string().regex(/^[0-9]{12}$/, "Aadhaar must be exactly 12 digits").optional().or(z.literal("")),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN format must be: ABCDE1234F").optional().or(z.literal("")),
  account_number: z.string().trim().min(8, "Account number must be at least 8 characters").max(20, "Account number must be less than 20 characters").optional().or(z.literal("")),
});

const nccSchema = z.object({
  ncc_wing: z.enum(["air", "army", "navy"]),
  regimental_number: z.string().trim().max(50, "Regimental number must be less than 50 characters").optional(),
  enrollment_date: z.string().optional(),
  cadet_rank: z.string().trim().max(50, "Cadet rank must be less than 50 characters").optional(),
});

const experienceSchema = z.object({
  experience: z.enum(["placement", "internship"]),
  company_name: z.string().trim().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
  role: z.string().trim().max(100, "Role must be less than 100 characters").optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [studentData, setStudentData] = useState<any>(null);
  const [nccDetails, setNccDetails] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    branch: "",
    year: "",
    address: "",
    phone_number: "",
    parents_phone_number: "",
    aadhaar_number: "",
    pan_number: "",
    account_number: "",
  });

  const [nccForm, setNccForm] = useState({
    ncc_wing: "air",
    regimental_number: "",
    enrollment_date: "",
    cadet_rank: "",
  });

  const [expForm, setExpForm] = useState({
    experience: "internship",
    company_name: "",
    role: "",
    start_date: "",
    end_date: "",
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

    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (student) {
      setStudentData(student);
      setFormData({
        name: student.name || "",
        email: student.email || "",
        branch: student.branch || "",
        year: student.year?.toString() || "",
        address: student.address || "",
        phone_number: student.phone_number || "",
        parents_phone_number: student.parents_phone_number || "",
        aadhaar_number: student.aadhaar_number || "",
        pan_number: student.pan_number || "",
        account_number: student.account_number || "",
      });

      const { data: ncc } = await supabase
        .from("ncc_details")
        .select("*")
        .eq("student_id", student.student_id);
      setNccDetails(ncc || []);

      const { data: exp } = await supabase
        .from("placements_internships")
        .select("*")
        .eq("student_id", student.student_id);
      setExperiences(exp || []);
    } else {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
      }));
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

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
        p_year: formData.year ? parseInt(formData.year) : null,
        p_address: formData.address || null,
        p_phone_number: formData.phone_number || null,
        p_parents_phone_number: formData.parents_phone_number || null,
        p_aadhaar_number: formData.aadhaar_number || null,
        p_pan_number: formData.pan_number || null,
        p_account_number: formData.account_number || null,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        fetchStudentData();
      }
    } else {
      // Use RPC function to insert with encryption
      const { error } = await supabase.rpc("insert_student_encrypted", {
        p_user_id: user.id,
        p_name: formData.name,
        p_email: formData.email,
        p_branch: formData.branch || null,
        p_year: formData.year ? parseInt(formData.year) : null,
        p_address: formData.address || null,
        p_phone_number: formData.phone_number || null,
        p_parents_phone_number: formData.parents_phone_number || null,
        p_aadhaar_number: formData.aadhaar_number || null,
        p_pan_number: formData.pan_number || null,
        p_account_number: formData.account_number || null,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile created successfully",
        });
        fetchStudentData();
      }
    }

    setLoading(false);
  };

  const handleNccSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) {
      toast({
        title: "Error",
        description: "Please save your student details first",
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    const validationResult = nccSchema.safeParse(nccForm);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("ncc_details").insert([
      {
        student_id: studentData.student_id,
        ncc_wing: nccForm.ncc_wing as "air" | "army" | "navy",
        regimental_number: nccForm.regimental_number || null,
        enrollment_date: nccForm.enrollment_date || null,
        cadet_rank: nccForm.cadet_rank || null,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "NCC details added successfully",
      });
      setNccForm({
        ncc_wing: "air",
        regimental_number: "",
        enrollment_date: "",
        cadet_rank: "",
      });
      fetchStudentData();
    }
  };

  const handleExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) {
      toast({
        title: "Error",
        description: "Please save your student details first",
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    const validationResult = experienceSchema.safeParse(expForm);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("placements_internships").insert([
      {
        student_id: studentData.student_id,
        experience: expForm.experience as "placement" | "internship",
        company_name: expForm.company_name,
        role: expForm.role || null,
        start_date: expForm.start_date || null,
        end_date: expForm.end_date || null,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Experience added successfully",
      });
      setExpForm({
        experience: "internship",
        company_name: "",
        role: "",
        start_date: "",
        end_date: "",
      });
      fetchStudentData();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} isAdmin={isAdmin} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">My Profile</h1>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Details</TabsTrigger>
            <TabsTrigger value="ncc">NCC Details</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>Update your personal and contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="parent_phone">Parent's Phone</Label>
                      <Input
                        id="parent_phone"
                        value={formData.parents_phone_number}
                        onChange={(e) => setFormData({ ...formData, parents_phone_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="aadhaar">Aadhaar Number</Label>
                      <Input
                        id="aadhaar"
                        value={formData.aadhaar_number}
                        onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                        maxLength={12}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pan">PAN Number</Label>
                      <Input
                        id="pan"
                        value={formData.pan_number}
                        onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                        maxLength={10}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="account">Account Number</Label>
                      <Input
                        id="account"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ncc">
            <Card>
              <CardHeader>
                <CardTitle>NCC Details</CardTitle>
                <CardDescription>Add your NCC enrollment information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNccSubmit} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ncc_wing">NCC Wing</Label>
                      <Select
                        value={nccForm.ncc_wing}
                        onValueChange={(value) => setNccForm({ ...nccForm, ncc_wing: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="air">Air</SelectItem>
                          <SelectItem value="army">Army</SelectItem>
                          <SelectItem value="navy">Navy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reg_number">Regimental Number</Label>
                      <Input
                        id="reg_number"
                        value={nccForm.regimental_number}
                        onChange={(e) => setNccForm({ ...nccForm, regimental_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="enrollment_date">Enrollment Date</Label>
                      <Input
                        id="enrollment_date"
                        type="date"
                        value={nccForm.enrollment_date}
                        onChange={(e) => setNccForm({ ...nccForm, enrollment_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cadet_rank">Cadet Rank</Label>
                      <Input
                        id="cadet_rank"
                        value={nccForm.cadet_rank}
                        onChange={(e) => setNccForm({ ...nccForm, cadet_rank: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Add NCC Details</Button>
                </form>

                {nccDetails.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Your NCC Records</h3>
                    {nccDetails.map((ncc) => (
                      <Card key={ncc.ncc_id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="font-medium">Wing:</span> {ncc.ncc_wing}</div>
                            <div><span className="font-medium">Rank:</span> {ncc.cadet_rank || "N/A"}</div>
                            <div className="col-span-2"><span className="font-medium">Reg No:</span> {ncc.regimental_number || "N/A"}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Placements & Internships</CardTitle>
                <CardDescription>Add your work experience</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExpSubmit} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exp_type">Type</Label>
                      <Select
                        value={expForm.experience}
                        onValueChange={(value) => setExpForm({ ...expForm, experience: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="placement">Placement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        value={expForm.company_name}
                        onChange={(e) => setExpForm({ ...expForm, company_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={expForm.role}
                        onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={expForm.start_date}
                        onChange={(e) => setExpForm({ ...expForm, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={expForm.end_date}
                        onChange={(e) => setExpForm({ ...expForm, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Add Experience</Button>
                </form>

                {experiences.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Your Experience</h3>
                    {experiences.map((exp) => (
                      <Card key={exp.experience_id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="space-y-1 text-sm">
                            <div className="font-semibold text-base">{exp.company_name}</div>
                            <div><span className="font-medium">Type:</span> {exp.experience}</div>
                            {exp.role && <div><span className="font-medium">Role:</span> {exp.role}</div>}
                            {exp.start_date && (
                              <div>
                                <span className="font-medium">Duration:</span> {exp.start_date} to {exp.end_date || "Present"}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
