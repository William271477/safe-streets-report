import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { IncidentCard, Incident } from "@/components/IncidentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Filter, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function MapView() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
    checkUser();

    // Set up real-time subscription
    const channel = supabase
      .channel('incidents-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          console.log('New incident:', payload);
          setIncidents(prev => [payload.new as Incident, ...prev]);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'incidents' },
        (payload) => {
          console.log('Updated incident:', payload);
          setIncidents(prev => 
            prev.map(incident => 
              incident.id === payload.new.id ? payload.new as Incident : incident
            )
          );
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'incidents' },
        (payload) => {
          console.log('Deleted incident:', payload);
          setIncidents(prev => 
            prev.filter(incident => incident.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [incidents, selectedCategory, selectedStatus]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

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

  const applyFilters = () => {
    let filtered = [...incidents];
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(incident => incident.category === selectedCategory);
    }
    
    if (selectedStatus !== "all") {
      filtered = filtered.filter(incident => incident.status === selectedStatus);
    }
    
    setFilteredIncidents(filtered);
  };

  const handleIncidentClick = (incident: Incident) => {
    navigate(`/incident/${incident.id}`);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      theft: 'bg-safety-theft',
      vandalism: 'bg-safety-vandalism', 
      accident: 'bg-safety-accident',
      suspicious: 'bg-safety-suspicious',
      emergency: 'bg-safety-emergency',
      other: 'bg-safety-other'
    };
    return colors[category as keyof typeof colors] || 'bg-safety-other';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-muted rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Incident Map</h1>
            <p className="text-muted-foreground">Interactive view of all reported incidents in your area</p>
          </div>
          {user && (
            <Button asChild className="mt-4 sm:mt-0">
              <Link to="/report">
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="vandalism">Vandalism</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="investigating">Under Investigation</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Placeholder - Interactive map coming soon */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interactive Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-96 rounded-lg overflow-hidden border bg-muted">
              <div className="h-full flex items-center justify-center relative">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Map Coming Soon</h3>
                  <p className="text-muted-foreground">Map integration with incident markers will be available soon</p>
                </div>
                
                {/* Mock map markers */}
                {filteredIncidents.slice(0, 5).map((incident, index) => (
                  <div
                    key={incident.id}
                    className={`absolute w-3 h-3 rounded-full ${getCategoryColor(incident.category)} border-2 border-background cursor-pointer hover:scale-125 transition-transform`}
                    style={{
                      left: `${20 + (index * 15)}%`,
                      top: `${30 + (index * 10)}%`,
                    }}
                    title={incident.title}
                    onClick={() => handleIncidentClick(incident)}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Incidents with location ({filteredIncidents.filter(i => i.latitude && i.longitude).length})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Incidents ({filteredIncidents.length})
            </h2>
            <div className="flex gap-2">
              {['theft', 'vandalism', 'accident', 'suspicious', 'emergency', 'other'].map((category) => (
                <div key={category} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                  <span className="text-xs text-muted-foreground capitalize">{category}</span>
                </div>
              ))}
            </div>
          </div>
          
          {filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No incidents found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or be the first to report an incident.
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
              {filteredIncidents.map((incident) => (
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
  }
];