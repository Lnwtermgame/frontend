import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { FeaturedGames } from "@/components/landing/featured-games";
import { Box } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box>
      <Hero />
      <Features />
      <FeaturedGames />
    </Box>
  );
}
