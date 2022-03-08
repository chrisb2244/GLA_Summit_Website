import { Box } from "@mui/material";

export const SocialMediaIcons: React.FC = (props) => {
  return (
    <Box
      role="grid"
      aria-label="Social Media Links"
      sx={{ "& a": { px: 0.4, "& img": { width: "20px" } } }}
    >
      <a href="https://abc.com">
        <img src="media/GLA-logo.svg" />
      </a>
      <a title="blah" href="https://def.com">
        <img src="media/GLA-logo.svg" />
      </a>
    </Box>
  );
};
