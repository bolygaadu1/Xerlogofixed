import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import OrdersList from '@/components/admin/OrdersList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ordersAPI, authAPI } from '@/services/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showClearOrdersDialog, setShowClearOrdersDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    checkAuthStatus();
  }, [navigate]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      await authAPI.verify(token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const clearAllOrders = async () => {
    try {
      await ordersAPI.deleteAll();
      toast.success("All orders have been cleared");
      setShowClearOrdersDialog(false);
      // Force reload the component to update UI
      window.location.reload();
    } catch (error) {
      console.error('Error clearing orders:', error);
      toast.error("Failed to clear orders");
    }
  };
  
  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-12 text-center">
          <p>Loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (!isLoggedIn) {
    return null; // Don't render anything while checking auth state
  }

  return (
    <PageLayout>
      <div className="py-6 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">
                Manage orders and settings
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
          
          <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto">
              <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">All Orders</h2>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto text-sm"
                  onClick={() => setShowClearOrdersDialog(true)}
                >
                  <Trash2 className="h-4 w-4" /> Clear All Orders
                </Button>
              </div>
              <OrdersList />
            </TabsContent>
            <TabsContent value="settings" className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-700 text-sm sm:text-base">Database Storage</h3>
                  <p className="mt-1 text-gray-600 text-sm">All order data is now stored in a MySQL database on the server. 
                  This ensures that all users see the same data and orders are persistent across sessions.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-700 text-sm sm:text-base">Admin Credentials</h3>
                  <p className="mt-1 text-gray-600 text-sm">Username: admin | Password: xerox123</p>
                  <p className="text-xs text-gray-500 mt-1">Credentials are securely hashed and stored in the database.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Alert Dialog for clearing orders */}
      <AlertDialog open={showClearOrdersDialog} onOpenChange={setShowClearOrdersDialog}>
        <AlertDialogContent className="mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all orders? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllOrders} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
              Yes, Clear All Orders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default Admin;