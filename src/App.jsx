import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { House, MagnifyingGlass, Heart, User } from "@phosphor-icons/react";
import CurvedBottomNav from "./components/CurvedBottomNav/CurvedBottomNav";

function HomePage() {
  return <Typography variant="h5">Home page content</Typography>;
}

function SearchPage() {
  return <Typography variant="h5">Search</Typography>;
}

function FavoritesPage() {
  return <Typography variant="h5">Your favorite items</Typography>;
}

function ProfilePage() {
  return <Typography variant="h5">Your profile</Typography>;
}

const tabs = [
  { label: "Home", icon: House, Page: HomePage },
  { label: "Search", icon: MagnifyingGlass, Page: SearchPage },
  { label: "Favorites", icon: Heart, Page: FavoritesPage },
  { label: "Profile", icon: User, Page: ProfilePage },
];

export default function App() {
  const [value, setValue] = useState(0);
  const { Page } = tabs[value];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 2,
        pb: 20,
        boxSizing: "border-box",
        color: "#fff",
        background: "linear-gradient(180deg, #b77ee3 0%, #c792ec 100%)",
      }}
    >
      <Page />
      <CurvedBottomNav tabs={tabs} value={value} onChange={setValue} />
    </Box>
  );
}
