import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner richColors position="top-right" {...props} />
);

export { Toaster };
