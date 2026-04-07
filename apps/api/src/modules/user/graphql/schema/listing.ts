export const listingTypeDef = `
  type Listing {
    id:      String             
  status:    ListingStatus        
  title:     String                
  size:      String
  vibe:      [Vibe]
  picture:   String
  order:     [Order]

  createdAt: DateTime
  updatedAt: DateTime 
}`;
