import { IImage } from "../../../Interfaces";

export interface IImageGalleryState {
  currentPage?: number;
  dQuery?: string;
  itemCount?: number;
  items?: any[];
  itemsNotFound?: boolean;
  itemsNotFoundMessage?: string;
  nextLink: string;
  pageSize?: number;
  sQuery?: string;
  selectedImage?: IImage;
  showLoader: boolean;
  showPanel: boolean;
  status?: string;
}