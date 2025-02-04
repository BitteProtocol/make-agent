import { useEffect } from "react";

export const Modal = ({
  children,
  isOpen,
  closeModal,
}: {
  children?: React.ReactNode;
  isOpen: boolean;
  closeModal: () => void;
}):JSX.Element  => {
  useEffect(() => {
    if (!isOpen) return;
    // Disable scrolling on the background (body) when the modal is open
    document.documentElement.style.overflow = "hidden";
    return () => {
      // Re-enable scrolling when the modal is closed
      document.documentElement.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return <></>;

  return (
    <div id="myModal" className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeModal}>
          &times;
        </span>
        <div>{children}</div>
      </div>
    </div>
  );
};
