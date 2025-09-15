import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-url.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      incidents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          category: 'emergency' | 'theft' | 'vandalism' | 'accident' | 'suspicious' | 'other'
          location: string
          latitude: number
          longitude: number
          status: 'new' | 'investigating' | 'resolved'
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          category: 'emergency' | 'theft' | 'vandalism' | 'accident' | 'suspicious' | 'other'
          location: string
          latitude: number
          longitude: number
          status?: 'new' | 'investigating' | 'resolved'
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          category?: 'emergency' | 'theft' | 'vandalism' | 'accident' | 'suspicious' | 'other'
          location?: string
          latitude?: number
          longitude?: number
          status?: 'new' | 'investigating' | 'resolved'
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string
        }
      }
    }
  }
}