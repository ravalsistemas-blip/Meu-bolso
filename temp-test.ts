// Test file to validate Database type structure
export type TestDatabase = {
  public: {
    Tables: {
      test_table: {
        Row: {
          id: string
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
      }
    }
  }
}
