declare module 'react-pdf' {
  import { ComponentType, ReactElement } from 'react';

  export interface DocumentProps {
    file: string | File | ArrayBuffer;
    onLoadSuccess?: ({ numPages }: { numPages: number }) => void;
    onLoadError?: (error: Error) => void;
    loading?: ReactElement | string;
    children?: React.ReactNode;
  }

  export interface PageProps {
    pageNumber: number;
    width?: number;
    height?: number;
    scale?: number;
    rotate?: number;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
    key?: string;
  }

  export type OnDocumentLoadSuccess = ({ numPages }: { numPages: number }) => void;

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    version: string;
  };
}