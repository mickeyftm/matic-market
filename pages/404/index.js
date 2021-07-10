import commonStyles from "@/styles/common.module.css";
import { SetTitle } from "@/components/SetTitle";

export default function Custom404() {
  return (
    <div className={commonStyles.centerContainer}>
      <SetTitle
        title={"Page Not Found"}
        description={"This page does not exists."}
      />
      <span> 404 | Page not found</span>
    </div>
  );
}
