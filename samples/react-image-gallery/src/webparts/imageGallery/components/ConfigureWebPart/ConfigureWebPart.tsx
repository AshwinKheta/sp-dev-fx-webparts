import * as React from 'react';

import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

import { IWebPartContext } from '@microsoft/sp-webpart-base';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import styles from './ConfigureWebPart.module.scss';

export interface IConfigureWebPartProps {
    buttonText?: string;
    description?: string;
    title: string;
    webPartContext: IWebPartContext;
}
const ConfigureWebPart: React.SFC<IConfigureWebPartProps> = (props) => {
    const {
        buttonText,
        description,
        title,
        webPartContext,
    } = props;
    return (
        <div className={styles.container}>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>
                <MessageBar messageBarType={MessageBarType.info} >
                    {description ? description : 'Please configure this web part\'s properties first.'}
                </MessageBar>
            </div>
            <div className={styles.button}>
                <PrimaryButton iconProps={{ iconName: 'Edit' }} onClick={(e) => { e.preventDefault(); webPartContext.propertyPane.open(); }}>
                    {buttonText ? buttonText : 'Configure Web Part'}
                </PrimaryButton>
            </div>
        </div>
    );
};
export default ConfigureWebPart;