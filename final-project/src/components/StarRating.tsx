import React, { useCallback, type KeyboardEvent, memo } from "react"; // Import React and hooks needed for callbacks and typing

// Define the props expected by the StarRating component
interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  reviewCount?: number;
  readOnly?: boolean;
}

// Define the StarRating component and wrap it in React.memo to avoid unnecessary re-renders
const StarRating = memo((props: StarRatingProps) => {
  const {
    rating = 0,
    setRating,
    reviewCount = 0,
    readOnly = false,
  } = props;

  // Calculate number of full stars (integer part of rating)
  const fullStars = Math.floor(rating);

  // Calculate fractional part of rating (e.g., 0.5)
  const fractionalPart = rating - fullStars;

  // Determine if a half-star should be displayed (if between 0.25 and 0.75)
  const hasHalfStar = fractionalPart >= 0.25 && fractionalPart < 0.75;

  // Check if the stars should be interactive (editable)
  const isInteractive = Boolean(setRating && !readOnly);

  // Handle click event to update the star rating
  const handleClick = useCallback(
    (value: number) => {
      // Only proceed if the rating is editable and the setRating function exists
      if (isInteractive && setRating) {
        try {
          setRating(value); // Update the rating with the selected value
        } catch (error) {
          console.error("Failed to set rating:", error);
        }
      }
    },
    [isInteractive, setRating]
  ); // Run when isInteractive, setRating changes

  // Handle keyboard events (Enter or Space) for accessibility
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>, value: number) => {
      // If Enter or Space is pressed and the stars are interactive
      if ((e.key === "Enter" || e.key === " ") && isInteractive) {
        handleClick(value); // Trigger rating update via keyboard
      }
    },
    [handleClick, isInteractive]
  ); // Run when handleClick, isInteractive changes

  // Render a single star (full, half, or empty) based on index
  const renderStar = (index: number) => {
    // Check if this star should be full
    const isFull = index < fullStars;

    // Check if this star should be a half star
    const isHalf = index === fullStars && hasHalfStar;

    // Base style for all stars
    const baseStyle: React.CSSProperties = {
      cursor: isInteractive ? "pointer" : "default",
      fontSize: "1.2rem",
      userSelect: "none",
      marginRight: 2,
    };

    // Render half star with overlapping spans for visual effect
    if (isHalf) {
      return (
        <span
          key={index}
          style={baseStyle}
          onClick={() => handleClick(index + 1)}
          onKeyDown={(e) => handleKeyDown(e, index + 1)}
          role={isInteractive ? "button" : undefined}
          aria-label={isInteractive ? `${index + 1} star` : undefined}
          tabIndex={isInteractive ? 0 : undefined}
        >
          <span
            style={{
              position: "relative",
              display: "inline-block",
              width: "1em",
            }}
          >
            <span
              style={{
                position: "absolute",
                overflow: "hidden",
                width: "50%",
                color: "gold",
              }}
            >
              ★
            </span>
            <span style={{ color: "lightgray" }}>★</span> {/* Gray half star behind */}
          </span>
        </span>
      );
    }

    // Render full or empty star
    return (
      <span
        key={index}
        style={{ ...baseStyle, color: isFull ? "gold" : "lightgray" }}
        onClick={() => handleClick(index + 1)}
        onKeyDown={(e) => handleKeyDown(e, index + 1)}
        role={isInteractive ? "button" : undefined}
        aria-label={isInteractive ? `${index + 1} star` : undefined}
        tabIndex={isInteractive ? 0 : undefined}
      >
        ★
      </span>
    );
  };

  // Render the full star rating component
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
      }}
      aria-label={`Rating: ${rating} out of 5`}
    >
      <span
        style={{
          fontWeight: 600,
          userSelect: "none",
          color: "black",
          whiteSpace: "nowrap",
        }}
      >
        Rating:
      </span>

      {/* Render 5 stars */}
      {[...Array(5)].map((_, i) => renderStar(i))}

      <span
        style={{
          marginLeft: 6,
          color: "#555",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {/* Show review count or fallback text */}
        {reviewCount > 0
          ? `(${reviewCount} review${reviewCount !== 1 ? "s" : ""})`
          : "(No reviews)"}
      </span>
    </div>
  );
});

// Export the memoized component as default
export default StarRating;