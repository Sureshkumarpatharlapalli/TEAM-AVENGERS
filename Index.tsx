import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, BookOpen, TrendingUp, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [userLanguages, setUserLanguages] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        loadUserData(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        loadUserData(session.user.id);
      } else {
        setUser(null);
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    // Load available languages
    const { data: langs } = await supabase
      .from("languages")
      .select("*")
      .order("name");
    
    if (langs) setLanguages(langs);

    // Load user's languages
    const { data: userLangs } = await supabase
      .from("user_languages")
      .select(", languages()")
      .eq("user_id", userId);
    
    if (userLangs) setUserLanguages(userLangs);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleAddLanguage = async (languageId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("user_languages")
      .insert({
        user_id: user.id,
        language_id: languageId,
        proficiency_level: "beginner",
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Language added to your learning list!",
      });
      loadUserData(user.id);
    }
  };

  const handleStartPractice = (languageId: string) => {
    navigate(/practice?language=${languageId});
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Languages className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">AI Language Coach</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Languages</h2>
            {userLanguages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    You haven't added any languages yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Choose a language below to start your learning journey!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userLanguages.map((userLang) => (
                  <Card key={userLang.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{userLang.languages.flag_emoji}</span>
                        <div>
                          <CardTitle className="text-lg">
                            {userLang.languages.name}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {userLang.proficiency_level}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        onClick={() => handleStartPractice(userLang.language_id)}
                      >
                        Practice Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Available Languages</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {languages
                .filter(
                  (lang) =>
                    !userLanguages.some((ul) => ul.language_id === lang.id)
                )
                .map((lang) => (
                  <Card key={lang.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{lang.flag_emoji}</span>
                          <CardTitle className="text-base">{lang.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAddLanguage(lang.id)}
                      >
                        Add to Learn
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;