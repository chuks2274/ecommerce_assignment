// This function converts a Date object into a string format 
export function toLocalDatetimeInputString(date: Date): string {

  // Helper function to add a leading 0 if number is less than 10 
  const pad = (n: number) => n.toString().padStart(2, "0");

  // Return a string like "2025-07-05T14:30"
  return (
    date.getFullYear() +                
    "-" +
    pad(date.getMonth() + 1) +          
    "-" +
    pad(date.getDate()) +               
    "T" +
    pad(date.getHours()) +              
    ":" +
    pad(date.getMinutes())              
  );
}