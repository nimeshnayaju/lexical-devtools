import {
  DetailedHTMLProps,
  HTMLAttributes,
  createContext,
  useContext,
  useId,
} from "react";

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface RootContextValue {
  open: boolean;
  onOpenChange(open: boolean): void;

  disabled: boolean;
  contentId: string;
}

const RootContext = createContext<RootContextValue | null>(null);

interface RootProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  open: boolean;
  onOpenChange(open: boolean): void;
  disabled?: boolean;
}

function Root(props: RootProps) {
  const { children, open, onOpenChange, disabled = false, ...divProps } = props;

  const id = useId();

  return (
    <RootContext.Provider
      value={{ open, onOpenChange, disabled, contentId: id }}
    >
      <div
        {...divProps}
        data-state={getState(open)}
        data-disabled={disabled ? "" : undefined}
      >
        {children}
      </div>
    </RootContext.Provider>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

function Trigger(
  props: DetailedHTMLProps<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
) {
  const { children, onClick, ...buttonProps } = props;
  const rootContext = useContext(RootContext);

  if (!rootContext) throw new Error("Missing RootContext Provider");

  const { open, disabled, contentId, onOpenChange } = rootContext;

  return (
    <button
      {...buttonProps}
      type="button"
      aria-controls={contentId}
      aria-expanded={open || false}
      data-state={getState(open)}
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (disabled) return;
        onOpenChange(!open);
      }}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

function Content(
  props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) {
  const { children, ...divProps } = props;
  const rootContext = useContext(RootContext);

  if (!rootContext) throw new Error("Missing RootContext Provider");

  const { open, disabled, contentId } = rootContext;

  return (
    <div
      {...divProps}
      data-state={getState(open)}
      data-disabled={disabled ? "" : undefined}
      id={contentId}
      hidden={!open}
    >
      {open && children}
    </div>
  );
}

function getState(isOpen: boolean) {
  return isOpen ? "open" : "closed";
}

export { Root, Trigger, Content };
