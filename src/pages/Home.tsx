import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { IncidentCard, Incident } from "@/components/IncidentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MapPin, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setIncidents(data as Incident[] || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      // For demo purposes, using mock data
      setIncidents(mockIncidents);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentClick = (incident: Incident) => {
    navigate(`/incident/${incident.id}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Community Safety Reports
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Stay informed about safety incidents in your neighborhood. Report issues and help keep your community safe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Button asChild size="lg">
                  <Link to="/report">
                    <Plus className="h-5 w-5 mr-2" />
                    Report an Incident
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link to="/auth?mode=signup">
                    <Shield className="h-5 w-5 mr-2" />
                    Join SafetyNet
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link to="/map">
                  <MapPin className="h-5 w-5 mr-2" />
                  View Map
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{incidents.length}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Community insights
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {incidents.filter(i => i.status !== 'resolved').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Under investigation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resolved Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {incidents.filter(i => i.status === 'resolved').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Community safe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Reports</h2>
            <Button variant="outline" asChild>
              <Link to="/map">View All on Map</Link>
            </Button>
          </div>

          {incidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No incidents reported yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to help keep your community informed and safe.
                </p>
                {user ? (
                  <Button asChild>
                    <Link to="/report">Report an Incident</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/auth?mode=signup">Sign Up to Report</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {incidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => handleIncidentClick(incident)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Mock data for demo purposes
const mockIncidents: Incident[] = [
  {
    id: '1',
    title: 'Suspicious vehicle in neighborhood',
    description: 'White van parked for several hours with no visible occupant, repeatedly circling the block.',
    category: 'suspicious',
    location: '123 Oak Street, Downtown',
    latitude: 40.7128,
    longitude: -74.0060,
    status: 'new',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_id: 'user1'
  },
  {
    id: '2',
    title: 'Bike theft from apartment complex',
    description: 'Mountain bike stolen from secured bike rack. Lock was cut. Security cameras may have captured footage.',
    category: 'theft',
    location: '456 Pine Avenue, Midtown',
    latitude: 40.7589,
    longitude: -73.9851,
    status: 'investigating',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user_id: 'user2'
  },
  {
    id: '3',
    title: 'Graffiti on community center wall',
    description: 'Large graffiti tags appeared overnight on the south wall of the community center.',
    category: 'vandalism',
    location: '789 Community Drive, Westside',
    latitude: 40.7505,
    longitude: -73.9934,
    status: 'resolved',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user_id: 'user3'
  },
  {
    id: '4',
    title: 'Car accident at main intersection',
    description: 'Two-vehicle collision at the intersection. Minor injuries reported, traffic being redirected.',
    category: 'accident',
    location: 'Main St & 1st Avenue',
    latitude: 40.7614,
    longitude: -73.9776,
    status: 'resolved',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user_id: 'user4'
  },
  {
    id: '5',
    title: 'Broken streetlight creating safety hazard',
    description: 'Streetlight has been out for 3 days, creating a dark spot that feels unsafe for pedestrians.',
    category: 'other',
    location: '321 Elm Street, Northside',
    latitude: 40.7831,
    longitude: -73.9712,
    status: 'new',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user_id: 'user5'
  }
];