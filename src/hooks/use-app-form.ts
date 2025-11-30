import { createFormHook } from "@tanstack/react-form";
import {
  Calendar,
  Checkbox,
  FormattedTextInput,
  MultiSelect,
  Select,
  SubscribeButton,
  Switch,
  TextArea,
  TextField,
} from "@/components/ui/form";
import { fieldContext, formContext } from "./use-form-context";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
    FormattedTextInput,
    Switch,
    Checkbox,
    MultiSelect,
    Calendar,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
});
