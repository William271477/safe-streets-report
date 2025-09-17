import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { IncidentCard, Incident } from "@/components/IncidentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Plus, BarChart3, Clock, CheckCircle, AlertCircle, User, MapPin } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    investigating: 0,
    resolved: 0
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth?redirect=/dashboard');
      return;
    }
    setUser(session.user);
    await Promise.all([
      fetchUserProfile(session.user.id),
      fetchUserIncidents(session.user.id)
    ]);
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserIncidents = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUserIncidents(data as Incident[] || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const newCount = data?.filter(i => i.status === 'new').length || 0;
      const investigating = data?.filter(i => i.status === 'investigating').length || 0;
      const resolved = data?.filter(i => i.status === 'resolved').length || 0;
      
      setStats({ total, new: newCount, investigating, resolved });
    } catch (error) {
      console.error('Error fetching user incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentClick = (incident: Incident) => {
    navigate(`/incident/${incident.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'text-status-new',
      investigating: 'text-status-investigating',
      resolved: 'text-status-resolved'
    };
    return colors[status as keyof typeof colors] || 'text-status-new';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.display_name || user?.email || 'User'}!
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link to="/report">
              <Plus className="h-4 w-4 mr-2" />
              Report New Incident
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                New
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-new">{stats.new}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Investigating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-investigating">{stats.investigating}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-resolved">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="incidents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="incidents">My Incidents</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          </TabsList>

          {/* Incidents Tab */}
          <TabsContent value="incidents">
            {userIncidents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No incidents reported yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start contributing to community safety by reporting your first incident.
                  </p>
                  <Button asChild>
                    <Link to="/report">Report an Incident</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => handleIncidentClick(incident)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.display_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Member Since</label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString()
                        : 'Unknown'
                      }
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Edit Profile (Coming Soon)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Total Reports</span>
                    <Badge variant="secondary">{stats.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Active Reports</span>
                    <Badge variant="secondary">{stats.new + stats.investigating}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Resolved Reports</span>
                    <Badge variant="secondary">{stats.resolved}</Badge>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/map">
                      <MapPin className="h-4 w-4 mr-2" />
                      View All on Map
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}