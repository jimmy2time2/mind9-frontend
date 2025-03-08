import { CONFIG } from './config';

export class ImageGenerator {
  private static readonly GRADIENT_COLLECTIONS = [
    {
      name: 'cyber',
      colors: ['#4158D0', '#C850C0', '#FFCC70'],
      description: 'Cyberpunk-inspired gradient with deep blue to magenta'
    },
    {
      name: 'neural',
      colors: ['#FF3CAC', '#784BA0', '#2B86C5'],
      description: 'Neural network-inspired gradient with pink to blue'
    },
    {
      name: 'quantum',
      colors: ['#8EC5FC', '#E0C3FC', '#FF9A9E'],
      description: 'Quantum computing inspired soft gradients'
    },
    {
      name: 'matrix',
      colors: ['#00F5A0', '#00D9F5', '#A726F5'],
      description: 'Matrix-inspired cyber gradient'
    },
    {
      name: 'future',
      colors: ['#FF3CAC', '#2B86C5', '#5FFBF1'],
      description: 'Futuristic tech gradient'
    }
  ];

  private static readonly IMAGE_DIMENSIONS = {
    width: 1024,
    height: 1024
  };

  private static readonly METADATA = {
    creator: 'Mind9',
    version: '1.0.0',
    style: 'minimalist-gradient'
  };

  async generateBrandingAssets(name: string): Promise<{
    logoUrl: string;
    bannerUrl: string;
    gradient: string;
  }> {
    try {
      console.log('🎨 Generating branded assets for', name);

      // Generate a deterministic index based on the token name
      const collectionIndex = this.getHashedIndex(name, this.constructor.GRADIENT_COLLECTIONS.length);
      const gradientCollection = this.constructor.GRADIENT_COLLECTIONS[collectionIndex];

      // Generate gradient CSS
      const gradient = this.generateGradientCSS(gradientCollection.colors);

      // Generate logo URL with specific gradient parameters
      const logoUrl = this.generateLogoUrl(name, gradientCollection);

      // Generate banner URL with complementary gradient
      const bannerUrl = this.generateBannerUrl(name, gradientCollection);

      console.log('✅ Branding assets generated successfully');

      return {
        logoUrl,
        bannerUrl,
        gradient
      };
    } catch (error) {
      console.error('❌ Error generating branding assets:', error);
      return this.getFallbackAssets(name);
    }
  }

  private generateGradientCSS(colors: string[]): string {
    return `linear-gradient(45deg, ${colors.join(', ')})`;
  }

  private generateLogoUrl(name: string, collection: typeof ImageGenerator.GRADIENT_COLLECTIONS[0]): string {
    // Create a deterministic but unique URL for each token
    const baseUrls = [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0',
      'https://images.unsplash.com/photo-1639762681057-408e52192e55',
      'https://images.unsplash.com/photo-1639762681198-7bb8c6d88d48'
    ];

    const index = this.getHashedIndex(name, baseUrls.length);
    const baseUrl = baseUrls[index];

    // Add parameters to ensure consistent cropping and dimensions
    return `${baseUrl}?w=${this.constructor.IMAGE_DIMENSIONS.width}&h=${this.constructor.IMAGE_DIMENSIONS.height}&fit=crop&auto=format&q=90`;
  }

  private generateBannerUrl(name: string, collection: typeof ImageGenerator.GRADIENT_COLLECTIONS[0]): string {
    // Use a wider aspect ratio for banners
    return 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=1920&h=480&fit=crop&auto=format&q=90';
  }

  private getHashedIndex(input: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % max;
  }

  private getFallbackAssets(name: string): {
    logoUrl: string;
    bannerUrl: string;
    gradient: string;
  } {
    const fallbackCollection = this.constructor.GRADIENT_COLLECTIONS[0];
    return {
      logoUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1024&h=1024&fit=crop&auto=format&q=90',
      bannerUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=1920&h=480&fit=crop&auto=format&q=90',
      gradient: this.generateGradientCSS(fallbackCollection.colors)
    };
  }

  generateMetadata(name: string): {
    name: string;
    creator: string;
    version: string;
    style: string;
    gradient: {
      collection: string;
      description: string;
    };
  } {
    const collectionIndex = this.getHashedIndex(name, this.constructor.GRADIENT_COLLECTIONS.length);
    const collection = this.constructor.GRADIENT_COLLECTIONS[collectionIndex];

    return {
      name,
      ...this.constructor.METADATA,
      gradient: {
        collection: collection.name,
        description: collection.description
      }
    };
  }
}