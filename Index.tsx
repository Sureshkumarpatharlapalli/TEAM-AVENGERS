// Dashboard page: user auth, language selection, navigation to practice
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [userLanguages, setUserLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchLanguages = async () => {
      const { data } = await supabase.from("languages").select("*");
      setLanguages(data || []);
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    const fetchUserLanguages = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_languages")
        .select(", language:language_id()")
        .eq("user_id", user.id);
      setUserLanguages(data || []);
    };
    fetchUserLanguages();
  }, [user]);

  const addLanguage = async () => {
    if (!user || !selectedLanguage) return;
    await supabase.from("user_languages").insert({
      user_id: user.id,
      language_id: selectedLanguage,
    });
    setSelectedLanguage(null);
    const { data } = await supabase
      .from("user_languages")
      .select(", language:language_id()")
      .eq("user_id", user.id);
    setUserLanguages(data || []);
  };

  const goToPractice = (languageId: string) => {
    navigate(/practice?language=${languageId});
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome to AI Language Coach</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select a Language to Learn</h2>
        <select
          className="border p-2 rounded w-full"
          value={selectedLanguage || ""}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="">-- Choose a language --</option>
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.flag_emoji} {lang.name}
            </option>
          ))}
        </select>
        <Button className="mt-2" onClick={addLanguage}>
          Add Language
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Your Languages</h2>
        <ul className="space-y-2">
          {userLanguages.map((ul) => (
            <li key={ul.id} className="flex justify-between items-center border p-2 rounded">
              <span>
                {ul.language.flag_emoji} {ul.language.name}
              </span>
              <Button onClick={() => goToPractice(ul.language_id)}>Practice Now</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Index;
