import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"; // Import useDispatch and useSelector from react-redux, and type helpers to make them strongly typed
import type { RootState, AppDispatch } from "./store"; // Import the types for the Redux store's state and dispatch function

// It helps send actions safely to the Redux store with TypeScript support
export const useAppDispatch: () => AppDispatch = useDispatch;

// It helps read state safely from the Redux store with TypeScript support
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;