export const orderTypeDef = `
  type Order {
    id:            String         
  status:          OrderStatus   
  userId:          String         
  user:            User           
  listingId:       String         
  listing:         Listing        
  buyerConfirmed:  Boolean        

  createdAt: DateTime 
  updatedAt: DateTime 
}
 enum OrderStatus {
  PENDING
  CONFIRMED
  CANCELLED
} 
`;
