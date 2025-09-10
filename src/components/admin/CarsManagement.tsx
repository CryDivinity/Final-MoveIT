import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CarData {
  id: string;
  user_id: string;
  name: string;
  model: string;
  plate_number: string;
  phone_number: string | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface CarsManagementProps {
  onStatsUpdate: () => void;
}

const CarsManagement = ({ onStatsUpdate }: CarsManagementProps) => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      
      // Fetch cars first
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (carsError) throw carsError;

      // Fetch profiles separately  
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name');

      if (profilesError) throw profilesError;

      // Combine the data
      const carsWithProfiles = carsData?.map(car => ({
        ...car,
        profiles: profilesData?.find(profile => profile.user_id === car.user_id) || null
      })) || [];

      setCars(carsWithProfiles as any);
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cars',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCar = async (carId: string) => {
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Car deleted successfully'
      });
      
      fetchCars();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting car:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete car',
        variant: 'destructive'
      });
    }
  };

  const filteredCars = cars.filter(car => 
    car.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cars Management</CardTitle>
            <CardDescription>Manage all registered vehicles in the platform</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">{car.name}</TableCell>
                    <TableCell>{car.model}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{car.plate_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {car.profiles?.first_name || car.profiles?.last_name 
                        ? `${car.profiles.first_name || ''} ${car.profiles.last_name || ''}`.trim()
                        : 'Unknown Owner'
                      }
                    </TableCell>
                    <TableCell>{car.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(car.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this car?')) {
                            deleteCar(car.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredCars.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No cars found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarsManagement;