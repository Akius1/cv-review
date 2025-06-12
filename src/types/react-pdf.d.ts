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

export interface Expert {
  id: string;
  name: string;
  email: string;
  expertise: string[];
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
}

export interface Availability {
  id: string;
  expertId: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  availabilityId: string;
  applicantId: string;
  expertId: string;
  startTime: Date;
  endTime: Date;
  googleMeetLink?: string;
  status: 'scheduled' | 'canceled' | 'completed';
}
