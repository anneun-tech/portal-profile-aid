import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [nccDetails, setNccDetails] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    checkAdminAndFetch();
  }, [user, navigate]);

  const checkAdminAndFetch = async () => {
    if (!user) return;

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await fetchAllData();
  };

  const fetchAllData = async () => {
    setLoading(true);

    const { data: studentsData } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: nccData } = await supabase
      .from("ncc_details")
      .select("*, students(name, email)")
      .order("created_at", { ascending: false });

    const { data: expData } = await supabase
      .from("placements_internships")
      .select("*, students(name, email)")
      .order("created_at", { ascending: false });

    setStudents(studentsData || []);
    setNccDetails(nccData || []);
    setExperiences(expData || []);
    setLoading(false);
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} isAdmin={isAdmin} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and view all student records</p>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="ncc">
              NCC Details ({nccDetails.length})
            </TabsTrigger>
            <TabsTrigger value="experience">
              Experiences ({experiences.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>All Students</CardTitle>
                <CardDescription>Complete student records</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : students.length === 0 ? (
                  <p className="text-center text-muted-foreground">No students found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Parent Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.student_id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{student.branch || "N/A"}</TableCell>
                            <TableCell>{student.year || "N/A"}</TableCell>
                            <TableCell>{student.phone_number || "N/A"}</TableCell>
                            <TableCell>{student.parents_phone_number || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ncc">
            <Card>
              <CardHeader>
                <CardTitle>NCC Details</CardTitle>
                <CardDescription>All NCC enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : nccDetails.length === 0 ? (
                  <p className="text-center text-muted-foreground">No NCC details found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Wing</TableHead>
                          <TableHead>Reg. Number</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Enrollment Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nccDetails.map((ncc: any) => (
                          <TableRow key={ncc.ncc_id}>
                            <TableCell className="font-medium">
                              {ncc.students?.name || "Unknown"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="uppercase">
                                {ncc.ncc_wing}
                              </Badge>
                            </TableCell>
                            <TableCell>{ncc.regimental_number || "N/A"}</TableCell>
                            <TableCell>{ncc.cadet_rank || "N/A"}</TableCell>
                            <TableCell>{ncc.enrollment_date || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Placements & Internships</CardTitle>
                <CardDescription>All student experiences</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : experiences.length === 0 ? (
                  <p className="text-center text-muted-foreground">No experiences found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {experiences.map((exp: any) => (
                          <TableRow key={exp.experience_id}>
                            <TableCell className="font-medium">
                              {exp.students?.name || "Unknown"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={exp.experience === "placement" ? "default" : "secondary"}
                              >
                                {exp.experience}
                              </Badge>
                            </TableCell>
                            <TableCell>{exp.company_name}</TableCell>
                            <TableCell>{exp.role || "N/A"}</TableCell>
                            <TableCell>
                              {exp.start_date
                                ? `${exp.start_date} to ${exp.end_date || "Present"}`
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

export default Admin;
