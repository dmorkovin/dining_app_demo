export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          student_id: string | null;
          points: number | null;
          tier: string | null;
          meals_count: number | null;
          meal_plan_type: string | null;
          guest_swipes: number | null;
          flex_dollars: number | null;
          dietary_alerts: string[] | null;
          dietary_preference: string | null;
          profile_image_url: string | null;
          hide_allergen_items: boolean | null;
          onboarding_completed: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          student_id?: string | null;
          points?: number | null;
          tier?: string | null;
          meals_count?: number | null;
          meal_plan_type?: string | null;
          guest_swipes?: number | null;
          flex_dollars?: number | null;
          dietary_alerts?: string[] | null;
          dietary_preference?: string | null;
          profile_image_url?: string | null;
          hide_allergen_items?: boolean | null;
          onboarding_completed?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          student_id?: string | null;
          points?: number | null;
          tier?: string | null;
          meals_count?: number | null;
          meal_plan_type?: string | null;
          guest_swipes?: number | null;
          flex_dollars?: number | null;
          dietary_alerts?: string[] | null;
          dietary_preference?: string | null;
          profile_image_url?: string | null;
          hide_allergen_items?: boolean | null;
          onboarding_completed?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          tags: string[] | null;
          allergens: string[] | null;
          image_url: string | null;
          trending: boolean | null;
          sold_count: number | null;
          station_id: number | null;
          created_at: string | null;
          price: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          tags?: string[] | null;
          allergens?: string[] | null;
          image_url?: string | null;
          trending?: boolean | null;
          sold_count?: number | null;
          station_id?: number | null;
          created_at?: string | null;
          price?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          tags?: string[] | null;
          allergens?: string[] | null;
          image_url?: string | null;
          trending?: boolean | null;
          sold_count?: number | null;
          station_id?: number | null;
          created_at?: string | null;
          price?: number | null;
        };
      };
      user_swipes: {
        Row: {
          id: string;
          user_id: string;
          menu_item_id: string;
          action: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          menu_item_id: string;
          action: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          menu_item_id?: string;
          action?: string;
          created_at?: string | null;
        };
      };
      polls: {
        Row: {
          id: string;
          question: string;
          active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          question: string;
          active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          question?: string;
          active?: boolean | null;
          created_at?: string | null;
        };
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string;
          text: string;
          vote_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          poll_id: string;
          text: string;
          vote_count?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          poll_id?: string;
          text?: string;
          vote_count?: number | null;
          created_at?: string | null;
        };
      };
      user_votes: {
        Row: {
          id: string;
          user_id: string;
          poll_id: string;
          option_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          poll_id: string;
          option_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          poll_id?: string;
          option_id?: string;
          created_at?: string | null;
        };
      };
      theme_proposals: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          vote_count: number | null;
          author_name: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          vote_count?: number | null;
          author_name: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          vote_count?: number | null;
          author_name?: string;
          created_at?: string | null;
        };
      };
      theme_upvotes: {
        Row: {
          id: string;
          user_id: string;
          theme_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme_id?: string;
          created_at?: string | null;
        };
      };
      rewards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          point_cost: number;
          icon: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          point_cost: number;
          icon?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          point_cost?: number;
          icon?: string | null;
          created_at?: string | null;
        };
      };
      rewards_transactions: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          description: string;
          type: string;
          icon: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          points: number;
          description: string;
          type: string;
          icon?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          points?: number;
          description?: string;
          type?: string;
          icon?: string | null;
          created_at?: string | null;
        };
      };
      staff: {
        Row: {
          id: string;
          name: string;
          role: string;
          bio: string | null;
          image_url: string | null;
          smile_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          bio?: string | null;
          image_url?: string | null;
          smile_count?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          bio?: string | null;
          image_url?: string | null;
          smile_count?: number | null;
          created_at?: string | null;
        };
      };
      smiles_sent: {
        Row: {
          id: string;
          user_id: string;
          staff_id: string;
          message: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          staff_id: string;
          message?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          staff_id?: string;
          message?: string | null;
          created_at?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          date: string;
          time: string;
          description: string | null;
          image_url: string | null;
          attendee_count: number | null;
          event_date: string | null;
          title: string | null;
          location: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          time: string;
          description?: string | null;
          image_url?: string | null;
          attendee_count?: number | null;
          event_date?: string | null;
          title?: string | null;
          location?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          time?: string;
          description?: string | null;
          image_url?: string | null;
          attendee_count?: number | null;
          event_date?: string | null;
          title?: string | null;
          location?: string | null;
          created_at?: string | null;
        };
      };
      event_rsvps: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          created_at?: string | null;
        };
      };
      weekly_menus: {
        Row: {
          id: string;
          day_name: string;
          day_number: number;
          main_dish: string | null;
          side_dish: string | null;
          is_today: boolean | null;
          items: Array<{ name: string; calories: number }> | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          day_name: string;
          day_number: number;
          main_dish?: string | null;
          side_dish?: string | null;
          is_today?: boolean | null;
          items?: Array<{ name: string; calories: number }> | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          day_name?: string;
          day_number?: number;
          main_dish?: string | null;
          side_dish?: string | null;
          is_today?: boolean | null;
          items?: Array<{ name: string; calories: number }> | null;
          created_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          from_name: string;
          message: string;
          icon: string | null;
          unread: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_name: string;
          message: string;
          icon?: string | null;
          unread?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_name?: string;
          message?: string;
          icon?: string | null;
          unread?: boolean | null;
          created_at?: string | null;
        };
      };
      videos: {
        Row: {
          id: string;
          title: string;
          category: string;
          duration: string | null;
          thumbnail_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          duration?: string | null;
          thumbnail_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          duration?: string | null;
          thumbnail_url?: string | null;
          created_at?: string | null;
        };
      };
      limited_time_offers: {
        Row: {
          id: string;
          menu_item_id: string;
          days_remaining: number;
          vote_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          days_remaining: number;
          vote_count?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          days_remaining?: number;
          vote_count?: number | null;
          created_at?: string | null;
        };
      };
      stations: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          short_description: string | null;
          icon: string | null;
          color: string | null;
          logo_url: string | null;
          location: string | null;
          hours: Record<string, { open: string | null; close: string | null; closed: boolean }> | null;
          is_active: boolean | null;
          display_order: number | null;
          todays_special: string | null;
          ordering_available: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          short_description?: string | null;
          icon?: string | null;
          color?: string | null;
          logo_url?: string | null;
          location?: string | null;
          hours?: Record<string, { open: string | null; close: string | null; closed: boolean }> | null;
          is_active?: boolean | null;
          display_order?: number | null;
          todays_special?: string | null;
          ordering_available?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          short_description?: string | null;
          icon?: string | null;
          color?: string | null;
          logo_url?: string | null;
          location?: string | null;
          hours?: Record<string, { open: string | null; close: string | null; closed: boolean }> | null;
          is_active?: boolean | null;
          display_order?: number | null;
          todays_special?: string | null;
          ordering_available?: boolean | null;
          created_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          station_id: number | null;
          order_number: string;
          status: string | null;
          notes: string | null;
          total_items: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          station_id?: number | null;
          order_number: string;
          status?: string | null;
          notes?: string | null;
          total_items?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          station_id?: number | null;
          order_number?: string;
          status?: string | null;
          notes?: string | null;
          total_items?: number | null;
          created_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          menu_item_id: string | null;
          quantity: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          menu_item_id?: string | null;
          quantity?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          menu_item_id?: string | null;
          quantity?: number | null;
          created_at?: string | null;
        };
      };
      order_feedback: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          station_id: number | null;
          overall_rating: number;
          reason_tags: string[] | null;
          comment: string | null;
          menu_item_ratings: { menu_item_id: string; name: string; rating: number }[] | null;
          routed_public: boolean | null;
          points_awarded: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          station_id?: number | null;
          overall_rating: number;
          reason_tags?: string[] | null;
          comment?: string | null;
          menu_item_ratings?: { menu_item_id: string; name: string; rating: number }[] | null;
          routed_public?: boolean | null;
          points_awarded?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string | null;
          station_id?: number | null;
          overall_rating?: number;
          reason_tags?: string[] | null;
          comment?: string | null;
          menu_item_ratings?: { menu_item_id: string; name: string; rating: number }[] | null;
          routed_public?: boolean | null;
          points_awarded?: boolean | null;
          created_at?: string | null;
        };
      };
    };
  };
}
