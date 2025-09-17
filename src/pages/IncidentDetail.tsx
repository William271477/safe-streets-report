import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Clock, User, Edit, Trash2, AlertCircle } from "lucide-react";
import { Incident } from "@/components/IncidentCard";

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIncident();
      checkUser();
    }
  }, [id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchIncident = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          profiles:user_id (
            display_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setIncident(data as Incident);
      
      // Check if current user is the owner
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && data.user_id === session.user.id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Error fetching incident:', error);
      // For demo purposes, use mock data
      const mockIncident = mockIncidents.find(i => i.id === id);
      if (mockIncident) {
        setIncident(mockIncident);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!incident || !isOwner) return;
    
    if (window.confirm('Are you sure you want to delete this incident report?')) {
      try {
        const { error } = await supabase
          .from('incidents')
          .delete()
          .eq('id', incident.id);

        if (error) throw error;
        
        navigate('/');
      } catch (error) {
        console.error('Error deleting incident:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-status-new',
      investigating: 'bg-status-investigating',
      resolved: 'bg-status-resolved'
    };
    return colors[status as keyof typeof colors] || 'bg-status-new';
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
            <div className="h-6 bg-muted rounded w-32 mb-6"></div>
            <div className="h-8 bg-muted rounded w-2/3 mb-4"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Incident Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The incident you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Link>
        </Button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Incident Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getCategoryColor(incident.category)} text-white`}>
                        {incident.category.charAt(0).toUpperCase() + incident.category.slice(1)}
                      </Badge>
                      <Badge className={`${getStatusColor(incident.status)} text-white`}>
                        {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">{incident.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {incident.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(incident.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {incident.profiles?.display_name || 'Anonymous User'}
                      </div>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/incident/${incident.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {incident.description || 'No additional details provided.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Map view coming soon</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground mb-1">Address</p>
                  <p className="text-sm text-muted-foreground">{incident.location}</p>
                  {incident.latitude && incident.longitude && (
                    <>
                      <p className="text-sm font-medium text-foreground mb-1 mt-2">Coordinates</p>
                      <p className="text-xs text-muted-foreground">
                        {incident.latitude}, {incident.longitude}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Incident Details */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Category</p>
                  <Badge className={`${getCategoryColor(incident.category)} text-white`}>
                    {incident.category.charAt(0).toUpperCase() + incident.category.slice(1)}
                  </Badge>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Status</p>
                  <Badge className={`${getStatusColor(incident.status)} text-white`}>
                    {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                  </Badge>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Reported</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
                
                {incident.updated_at !== incident.created_at && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(incident.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {!isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" disabled>
                      Contact Reporter
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      Add Update
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Additional features coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_id: 'user1',
    profiles: { display_name: 'John Doe' }
  }
];