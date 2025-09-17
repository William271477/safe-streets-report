import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, AlertCircle, CheckCircle, Upload, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FormData {
  title: string;
  description: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  image?: File;
}

export default function ReportIncident() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    location: '',
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth?redirect=/report');
      return;
    }
    setUser(session.user);
  };

  const handleInputChange = (field: keyof FormData, value: string | number | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('incident-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('incident-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapPosition([lat, lng]);
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your current location. Please set it manually on the map.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation. Please set location manually on the map.",
        variant: "destructive"
      });
    }
  };

  const handleMapPositionChange = (position: [number, number] | null) => {
    setMapPosition(position);
    if (position) {
      setFormData(prev => ({
        ...prev,
        latitude: position[0],
        longitude: position[1]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (formData.image) {
        imageUrl = await uploadImage(formData.image, user.id);
        if (!imageUrl) {
          toast({
            title: "Image upload failed",
            description: "Continuing without image.",
            variant: "destructive"
          });
        }
      }

      const { error } = await supabase
        .from('incidents')
        .insert([{
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          image_url: imageUrl,
          user_id: user.id,
          status: 'new'
        }]);

      if (error) throw error;

      toast({
        title: "Incident reported successfully",
        description: "Thank you for helping keep the community safe.",
      });

      navigate('/map');
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast({
        title: "Error reporting incident",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.category;
      case 2:
        return formData.location.trim();
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
            <p className="text-muted-foreground">Please sign in to report an incident.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Report an Incident</h1>
          <p className="text-muted-foreground">Help keep your community safe by reporting safety incidents.</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step > stepNumber ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step > stepNumber ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">Details</span>
            <span className="text-xs text-muted-foreground">Location</span>
            <span className="text-xs text-muted-foreground">Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the incident"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="vandalism">Vandalism</SelectItem>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about what happened..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include relevant details like time, people involved, and any other important information.
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <Label htmlFor="image">Photo Evidence (Optional)</Label>
                  <div className="mt-2">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-muted-foreground
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90"
                    />
                    {imagePreview && (
                      <div className="mt-3">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a photo to help provide visual evidence of the incident.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">Address or Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., 123 Main St, Downtown or Near City Park"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    required
                  />
                </div>

                {/* Map Placeholder - Interactive location picker coming soon */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Set Location (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Use My Location
                    </Button>
                  </div>
                  <div className="h-48 rounded-lg overflow-hidden border bg-muted">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Interactive location picker coming soon</p>
                        <p className="text-xs text-muted-foreground mt-1">Use the button above to get your current location</p>
                        {mapPosition && (
                          <p className="text-xs text-foreground mt-2 font-medium">
                            Location set: {mapPosition[0].toFixed(4)}, {mapPosition[1].toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click "Use My Location" to automatically set your current coordinates, or manually enter them below.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude (Optional)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="40.7128"
                      value={formData.latitude || ''}
                      onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude (Optional)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="-74.0060"
                      value={formData.longitude || ''}
                      onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review and Submit */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <p className="text-foreground">{formData.title}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-foreground capitalize">{formData.category}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-foreground">{formData.location}</p>
                </div>

                {formData.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-foreground whitespace-pre-wrap">{formData.description}</p>
                  </div>
                )}

                {imagePreview && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Photo Evidence</Label>
                    <img 
                      src={imagePreview} 
                      alt="Incident evidence" 
                      className="mt-2 max-w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Before submitting:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure all information is accurate</li>
                    <li>• Your report will be visible to the community</li>
                    <li>• You can edit or delete your report later</li>
                    <li>• For emergencies, contact local authorities directly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep} 
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button 
                type="button" 
                onClick={nextStep} 
                disabled={!isStepValid()}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}