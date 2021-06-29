import { SetTitle } from "@/components/SetTitle";
import { SmartInput } from "@/components/SmartInput";
import { IconWithPopOver } from "@/components/IconWithPopOver";
import styles from "@/styles/common.module.css";
import homeStyles from "@/styles/Home.module.css";
import SEO from "@/seo/home";
import Image from "next/image";
import { useState } from 'react';
import { addClasses } from "@/utils/Helpers";

export default function Home() {
  const [slippagePercent, setSlippagePercent] = useState(1);
  const [isCustomSlippage, setIsCustomSlippage] = useState(false);

  const onSlippageChange = (value, isCustomSlippage = false) => {
    const onlyNumberRegex = /^\d*\.?\d*$/
    console.log( value, Number(value) )

    if( onlyNumberRegex.test(value) && Number(value) < 100 ) {
      setIsCustomSlippage(isCustomSlippage);
      setSlippagePercent(value);
    }
  }

  return (
    <div className={styles.centerContainer}>
      <SetTitle title={SEO.title} description={SEO.description} />
      <div className={homeStyles.swapToken}>
        <SmartInput
          label={'From'}  
        />
        <Image
          className={homeStyles.convertIcon}
          width={25}
          height={25}
          src={"/images/arrow-down.svg"}
          alt={"convert"}
        />

        <SmartInput
          label={'To'}
          readOnly={true}
        />

        <div className={homeStyles.advanceOptions}>
          <h3>
            {'Advance Options'}
          </h3>
          <div className={homeStyles.slippage}>
            <div>
              <span>
                {'Slippage tolerance'}
              </span>
              <IconWithPopOver />
            </div>
            <button onClick={() => onSlippageChange(1)} className={ !isCustomSlippage && slippagePercent === 1 && homeStyles.activeSlippage}>1%</button>
            <button onClick={() => onSlippageChange(2)} className={ !isCustomSlippage && slippagePercent === 2 && homeStyles.activeSlippage}>2%</button>
            <input
              value={isCustomSlippage ? slippagePercent : ''}
              className={addClasses([homeStyles.slippagePercent, isCustomSlippage && homeStyles.activeSlippage])}
              placeholder={'1.2'}
              onChange={(e) =>onSlippageChange(e.target.value, true)}
            />
            <span>%</span>
          </div>
        </div>

        <button className={homeStyles.submitBtn}>
          {'Swap'}
        </button>
      </div>
    </div>
  );
}
