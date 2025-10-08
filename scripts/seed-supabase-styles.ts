import { supabase } from '../src/utils/supabase';

const tattooStyles = [
  { name: '3D', description: 'Three-dimensional realistic tattoos' },
  { name: 'Abstract', description: 'Abstract and artistic designs' },
  { name: 'Anime', description: 'Japanese anime and manga style' },
  { name: 'Black & Grey', description: 'Classic black and grey tattoos' },
  { name: 'Biomechanical', description: 'Mechanical and organic fusion' },
  { name: 'Blackwork', description: 'Bold black ink designs' },
  { name: 'Chicano', description: 'Chicano culture inspired tattoos' },
  { name: 'Color', description: 'Vibrant colorful tattoos' },
  { name: 'Cover Up', description: 'Covering existing tattoos' },
  { name: 'Dotwork', description: 'Stippling and dot technique' },
  { name: 'Fine Line', description: 'Delicate thin line work' },
  { name: 'Geometric', description: 'Geometric patterns and shapes' },
  { name: 'Horror', description: 'Horror and dark themed tattoos' },
  { name: 'Illustrative', description: 'Illustration style tattoos' },
  { name: 'Japanese', description: 'Traditional Japanese style' },
  { name: 'Lettering', description: 'Text and calligraphy' },
  { name: 'Mandala', description: 'Sacred geometric mandala designs' },
  { name: 'Minimalist', description: 'Simple and clean designs' },
  { name: 'Neo Traditional', description: 'Modern traditional style' },
  { name: 'New School', description: 'Cartoon-like vibrant style' },
  { name: 'Old School', description: 'Classic American traditional' },
  { name: 'Ornamental', description: 'Decorative ornamental designs' },
  { name: 'Portrait', description: 'Realistic portrait tattoos' },
  { name: 'Realism', description: 'Photorealistic tattoos' },
  { name: 'Religious', description: 'Religious and spiritual themes' },
  { name: 'Sketch', description: 'Sketch-like artistic style' },
  { name: 'Surrealism', description: 'Surreal and dreamlike designs' },
  { name: 'Trash Polka', description: 'Abstract realistic combination' },
  { name: 'Tribal', description: 'Traditional tribal patterns' },
  { name: 'Watercolor', description: 'Watercolor painting effect' }
];

async function seedTattooStyles() {
  console.log('🎨 Seeding tattoo styles to Supabase...');
  
  try {
    // Check if styles already exist
    const { data: existingStyles, error: checkError } = await supabase
      .from('tattoo_styles')
      .select('id, name')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing styles:', checkError);
      return;
    }
    
    if (existingStyles && existingStyles.length > 0) {
      console.log('✅ Tattoo styles already exist in database');
      return;
    }
    
    // Insert styles
    const { data, error } = await supabase
      .from('tattoo_styles')
      .insert(tattooStyles.map(style => ({
        id: crypto.randomUUID(),
        name: style.name,
        description: style.description,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })));
    
    if (error) {
      console.error('Error inserting tattoo styles:', error);
      return;
    }
    
    console.log(`✅ Successfully seeded ${tattooStyles.length} tattoo styles`);
  } catch (error) {
    console.error('Error seeding tattoo styles:', error);
  }
}

// Run the seeding
seedTattooStyles();
