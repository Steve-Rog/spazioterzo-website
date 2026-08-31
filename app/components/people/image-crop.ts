import type { TeamMember } from "./content";
import { imageCropStyle } from "../ui/image-crop";

export const portraitCropStyle = (member: TeamMember) => imageCropStyle(member.imageCrop);
