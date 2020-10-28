import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as strings from 'ImageGalleryWebPartStrings';

import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField } from '@microsoft/sp-webpart-base';

import ConfigureWebPart from './components/ConfigureWebPart/ConfigureWebPart';
import { IImageGalleryProps } from './components/IImageGalleryProps';
import ImageGallery from './components/ImageGallery';
import { ListService } from '../../Services/ListService';
import { Version } from '@microsoft/sp-core-library';
import { sp } from '@pnp/sp';

export interface IImageGalleryWebPartProps {
  imageLibrary: string;
  pageSize: number;
}
export default class ImageGalleryWebPart extends BaseClientSideWebPart<IImageGalleryWebPartProps> {
  private listService: ListService;
  protected async onInit(): Promise<void> {
    const _ = await super.onInit();
    this.listService = new ListService(this.context.spHttpClient);
    sp.setup({
      spfxContext: this.context
    });
  }
  public render(): void {
    // const element: React.ReactElement<IImageGalleryProps > = React.createElement(
    //   ImageGallery,
    //   {
    //     description: this.properties.imageLibrary
    //   }
    // );
    let element: any;
    if (this.properties.imageLibrary && this.properties.pageSize) {
      element = React.createElement<IImageGalleryProps>(
        ImageGallery,
        {
          context: this.context,
          listName: this.properties.imageLibrary,
          pageSize: this.properties.pageSize,
          siteUrl: this.context.pageContext.site.absoluteUrl
        }
      );
    }
    else {
      // show configure web part react component
      element = React.createElement(
        ConfigureWebPart,
        {
          buttonText: strings.ConfigureWebpartButtonText,
          description: strings.MissingListConfiguration,
          title: "Image Gallery",
          webPartContext: this.context
        }
      );
    }
    ReactDom.render(element, this.domElement);
  }
  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
  protected get disableReactivePropertyChanges(): boolean {
    return true;
  }
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('imageLibrary', {
                  label: strings.ImageLibraryFieldLabel
                }),
                PropertyPaneSlider('pageSize', {
                  label: "Page Size",
                  max: 20,
                  min: 2,
                  showValue: true,
                  step: 1,
                  value: 5
                })
              ]
            }
          ]
        }
      ]
    };
  }
}