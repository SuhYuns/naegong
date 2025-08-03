// lib/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          gender: string | null;
          address: string | null;
          birth_year: number | null;
          phone_number: string | null;
          is_manager: boolean;
          is_provider: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          gender?: string;
          address?: string;
          birth_year?: number;
          phone_number?: string;
          is_manager?: boolean;
          is_provider?: number;
        };
        Update: {
          gender?: string;
          address?: string;
          birth_year?: number;
          phone_number?: string;
          is_manager?: boolean;
          is_provider?: number;
        };
      };
      // 필요하다면 다른 테이블 타입도 여기에 추가...
    };
    // Functions, Enums, etc. 생략 가능
  };
}
