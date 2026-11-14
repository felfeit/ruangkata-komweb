
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const articleImageBucket =
  process.env.SUPABASE_ARTICLE_IMAGE_STORAGE_BUCKET;

const profileImageBucket =
  process.env.SUPABASE_PROFILE_IMAGE_STORAGE_BUCKET;

if (!articleImageBucket || !profileImageBucket) {
  throw new Error("Supabase storage bucket environment variables are missing");
}

module.exports = {
  supabase,
  articleImageBucket,
  profileImageBucket,
};
