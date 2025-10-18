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
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    supabase.from("languages").select("*").then(({ data }) => {
      if (data) setLanguages(data);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_languages")
      .select(", language:language_id()")
      .eq("user_id", user.id)
      .then(({ data,error }) =>{
        if (error) {
          console.eror("Error fetching user language:",error);
        }else if (data) {
          setuserLanguages(data);
        }
      });
  },  [user]);
  
