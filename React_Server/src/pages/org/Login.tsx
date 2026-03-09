import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormInput from "@/components/FormInput";

const OrgLogin = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/org/dashboard");
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Organization Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput 
                label="Username" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />
              <FormInput 
                label="Password" 
                type="password" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-white/20 hover:bg-white/10 text-white"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>

              <p className="text-center text-sm text-white/60">
                Don't have an account?{" "}
                <a href="/org/register" className="text-purple-400 hover:underline">
                  Register here
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default OrgLogin;
