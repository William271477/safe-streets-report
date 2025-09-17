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
import { MapPin, AlertCircle, CheckCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  title: string;
  description: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export default function ReportIncident() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
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

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('incidents')
        .insert([{
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          user_id: user.id,
          status: 'new'
        }]);

      if (error) throw error;

      toast({
        title: "Incident reported successfully",
        description: "Thank you for helping keep the community safe.",
      });

      navigate('/');
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

                {/* Map Placeholder */}
                <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Interactive map coming soon</p>
                    <p className="text-xs text-muted-foreground">For now, please enter the address above</p>
                  </div>
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