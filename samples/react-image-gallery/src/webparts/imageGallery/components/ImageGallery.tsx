import * as React from 'react';

import { IImage, IListService } from '../../../Interfaces';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { objectDefinedNotNull, stringIsNullOrEmpty } from '@pnp/common';

import { Button } from 'office-ui-fabric-react/lib/Button';
import { IImageGalleryProps } from './IImageGalleryProps';
import { IImageGalleryState } from './IImageGalleryState';
import { IPickerTerms } from "@pnp/spfx-controls-react/lib/TaxonomyPicker";
import { ListService } from '../../../Services/ListService';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { css } from '@uifabric/utilities/lib';
import styles from './ImageGallery.module.scss';

export default class ImageGallery extends React.Component<IImageGalleryProps, IImageGalleryState> {
  private _spService: IListService;
  private expandQuery: string[] = [];
  private filterQuery: string[] = [];
  private selectQuery: string[] = [];
  private urlCollection: string[] = [];
  /**
   *
   */
  constructor(props: IImageGalleryProps, state: IImageGalleryState) {
    super(props);
    this.state = {
      currentPage: 1,
      items: [],
      itemsNotFound: false,
      nextLink: "",
      pageSize: this.props.pageSize,
      selectedImage: {} as IImage,
      showLoader: false,
      showPanel: false
    };
    this._onClickNext = this._onClickNext.bind(this);
    this._onClickPrevious = this._onClickPrevious.bind(this);
    this._onImageClick = this._onImageClick.bind(this);
    this._onSearchChange = this._onSearchChange.bind(this);
    this._onTaxPickerChange = this._onTaxPickerChange.bind(this);
    this._spService = new ListService(this.props.context.spHttpClient);
  }
  public async componentDidMount() {
    //Get Images from the library
    let value = await this._spService.getListItemsCount(`${this.props.siteUrl}/_api/web/lists/GetByTitle('${this.props.listName}')/ItemCount`);
    this.setState({
      itemCount: value
    });
    const queryParam = this.buildQueryParams();
    let url = `${this.props.siteUrl}/_api/web/lists/GetByTitle('${this.props.listName}')/items/${queryParam}`;
    this.urlCollection.push(url);
    this._readItems(url);
  }
  private async _readItems(url: string) {
    this.setState({
      items: [],
      showLoader: true,
      status: 'Loading all items...'
    });
    let response = await this._spService.readItems(url);
    if (objectDefinedNotNull(response)) {
      if (objectDefinedNotNull(response.nextLink)) {
        this.urlCollection.push(response.nextLink);
      }
      this.setState({
        items: response.items,
        showLoader: false,
        status: `Showing items ${(this.state.currentPage - 1) * this.props.pageSize + 1} - ${((this.state.currentPage - 1) * this.props.pageSize) + response.items.length} of ${this.state.itemCount}`
      });
    }
    else {
      this.setState({
        items: [],
        itemsNotFound: true,
        showLoader: false,
        status: ""
      });
    }
  }
  private async _onClickNext() {
    this.setState({
      currentPage: this.state.currentPage + 1,
      showLoader: true
    });
    let url = this.urlCollection[this.urlCollection.length - 1];
    this._readItems(url);
  }
  private async _onClickPrevious() {
    let url = "";
    if (this.urlCollection.length > 1) {
      this.setState({
        currentPage: this.state.currentPage - 1
      });
      this.urlCollection.pop();
      url = this.urlCollection[this.urlCollection.length - 1];
    }
    else {
      url = this.urlCollection[0];
    }
    this.setState({
      items: [],
      showLoader: true,
      status: 'Loading all items...'
    });
    let response = await this._spService.readItems(url);
    this.setState({
      items: response.items,
      showLoader: false,
      status: `Showing items ${(this.state.currentPage - 1) * this.props.pageSize + 1} - ${((this.state.currentPage - 1) * this.props.pageSize) + response.items.length} of ${this.state.itemCount}`
    });
  }
  private buildQueryParams(taxQuery?: string, searchQuery?: string): string {
    this.expandQuery = [];
    this.filterQuery = [];
    this.selectQuery = [];
    this.selectQuery.push("FileLeafRef");
    this.selectQuery.push("FileRef");
    this.selectQuery.push("ID");
    this.selectQuery.push("TaxCatchAll/Term");
    this.selectQuery.push("Title");
    this.expandQuery.push("TaxCatchAll");
    this.filterQuery.push(this.buildFilterQuery(taxQuery, searchQuery));
    const queryParam = `?%24skiptoken=Paged%3dTRUE%26p_ID=0&$top=${this.state.pageSize}`;
    const selectColumns = this.selectQuery === null || this.selectQuery === undefined || this.selectQuery.length === 0 ? "" : '&$select=' + this.selectQuery.join();
    const filterColumns = this.filterQuery === null || this.filterQuery === undefined || this.filterQuery.length === 0 ? "" : '&$filter=' + this.filterQuery.join();
    const expandColumns = this.expandQuery === null || this.expandQuery === undefined || this.expandQuery.length === 0 ? "" : '&$expand=' + this.expandQuery.join();
    return queryParam + selectColumns + filterColumns + expandColumns;
  }
  private buildQueryParamsTotalFilteredItems(taxQuery?: string, searchQuery?: string): string {
    this.filterQuery = [];
    this.selectQuery = [];
    this.selectQuery.push("ID");
    this.filterQuery.push(this.buildFilterQuery(taxQuery, searchQuery));
    const queryParam = "?";
    const selectColumns = this.selectQuery === null || this.selectQuery === undefined || this.selectQuery.length === 0 ? "" : '&$select=' + this.selectQuery.join();
    const filterColumns = this.filterQuery === null || this.filterQuery === undefined || this.filterQuery.length === 0 ? "" : '&$filter=' + this.filterQuery.join();
    return queryParam + selectColumns + filterColumns;
  }
  private buildFilterQuery(taxQuery: string, searchQuery: string) {
    let result: string = "";
    if (!stringIsNullOrEmpty(taxQuery) && stringIsNullOrEmpty(searchQuery)) {
      result = `TaxCatchAll/Term eq '${taxQuery}'`;
    }
    if (stringIsNullOrEmpty(taxQuery) && !stringIsNullOrEmpty(searchQuery)) {
      result = `startswith(Title,'${searchQuery}')`;
    }
    if (!stringIsNullOrEmpty(taxQuery) && !stringIsNullOrEmpty(searchQuery)) {
      result = `(TaxCatchAll/Term eq '${taxQuery}') and (startswith(Title,'${searchQuery}'))`;
    }
    if (stringIsNullOrEmpty(taxQuery) && stringIsNullOrEmpty(searchQuery)) {
      result = "";
    }
    return result;
  }
  private async _onTaxPickerChange(terms: IPickerTerms) {
    this.urlCollection = [];
    let query = "";
    query = terms.length && terms[0].name ? terms[0].name : "";
    this.setState({
      dQuery: query
    });
    let queryParam = this.buildQueryParamsTotalFilteredItems(query, this.state.sQuery);
    let response = await this._spService.readItems(`${this.props.siteUrl}/_api/web/lists/GetByTitle('${this.props.listName}')/items/${queryParam}`);
    this.setState({
      itemCount: response.items.length
    });
    queryParam = this.buildQueryParams(query, this.state.sQuery);
    let url = `${this.props.siteUrl}/_api/web/lists/GetByTitle('${this.props.listName}')/items/${queryParam}`;
    this.urlCollection.push(url);
    this._readItems(url);
  }
  private async _onSearchChange(query: any) {
    this.urlCollection = [];
    this.setState({
      sQuery: query
    });
    let queryParam = this.buildQueryParamsTotalFilteredItems(this.state.dQuery, query);
    let response = await this._spService.readItems(`${this.props.siteUrl}/_api/web/lists/GetByTitle('${this.props.listName}')/items/${queryParam}`);
    if (objectDefinedNotNull(response)) {
      this.setState({
        itemCount: response.items.length
      });
    }
    else {
      this.setState({
        itemCount: 0
      });
    }
    queryParam = this.buildQueryParams(this.state.dQuery, query);
    let url = `${this.props.siteUrl}/_api/web/lists/GetByTitle('${this.props.listName}')/items/${queryParam}`;
    this.urlCollection.push(url);
    this._readItems(url);
  }
  private _onImageClick(selectedImage: any): void {
    this.setState({
      selectedImage,
      showPanel: true
    });
  }
  public render(): React.ReactElement<IImageGalleryProps> {
    const spinnerStyles = props => ({
      circle: [
        {
          borderWidth: '4px',
          height: '60px',
          selectors: {
            ':hover': {
              background: 'f8f8ff8',
            }
          },
          width: '60px',
        }
      ]
    });
    let result = [];
    let tagList;
    if (this.state.items.length) {
      result = this.state.items.map((item, index) => {
        return (
          <div
            className={css(styles.column, styles.mslg3)}
            key={index}
            onClick={() => this._onImageClick(item)}>
            <div className={css(styles.thumbnail)}>
              <img src={item.FileRef} title={item.Title} id={item.Id} />
              <figcaption>{item.Title}</figcaption>
            </div>
          </div>
        );
      });
    }
    return (
      <div className={styles.imageGallery}>
        <div className={styles.container} dir="ltr">
          <div className={css(styles.row, styles.header)}>
            <div className={css(styles.column, styles.mslg12, styles.pageTitle)}>
              <h1>Image Gallery <small> Filterable</small></h1></div>
          </div>
          <div className={css(styles.row, styles.filters)}>
            <div className={css(styles.column, styles.mslg12, styles.panel)}>
              <div className={styles.panelBody}>
                <div className={css(styles.column, styles.mslg3, "ms-u-lgPush6", styles.searchBox)}>
                  <TextField label="Search" className={styles.searchBoxInputField} placeholder="Enter search term" onChanged={this._onSearchChange} />
                </div>
              </div>
            </div>
          </div>
          <div className={css(styles.row)}>
            <div className={css(styles.column, styles.mslg12, styles.panel)}>
              <div className={styles.panelBody}>
                {this.state.showLoader ? <Spinner size={SpinnerSize.large} label="loading..." className={css(styles.loader)} getStyles={spinnerStyles} /> : ""}
                <div className={css(styles.row, styles.mainContent)}>
                  {result.length > 0 ? result : ""}
                  {!result.length && this.state.itemsNotFound ? <MessageBar messageBarType={MessageBarType.warning} isMultiline={false} dismissButtonAriaLabel="Close">
                    Items not found. Try different search keyword
                  </MessageBar> : ""}
                  <Panel isOpen={this.state.showPanel} type={PanelType.medium} onDismiss={() => this.setState({ showPanel: false })} headerText={this.state.selectedImage.Title}>
                    <div className={styles.modalContent}>
                      <div className={styles.modalBody}>
                        <div className={styles.thumbnail}>
                          <img src={this.state.selectedImage.FileRef} title={this.state.selectedImage.Title} id={this.state.selectedImage.Id} />
                        </div>
                        <h3>Tags</h3>
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </div>
          <div className={css(styles.row, styles.pagination)}>
            <div className={css(styles.column, styles.mslg12, styles.panel)}>
              <div className={styles.panelBody}>
                <div className={styles.status}>{this.state.status}</div>
                <ul className={styles.pager}>
                  <li>
                    <Button disabled={((this.state.currentPage - 1) * this.props.pageSize + 1) <= 1} onClick={this._onClickPrevious}>Previous</Button>
                  </li>
                  <li>
                    <Button disabled={((this.state.currentPage - 1) * this.props.pageSize) + this.state.items.length >= this.state.itemCount} onClick={this._onClickNext}>Next</Button>
                  </li>
                </ul>
              </div></div>
          </div>
        </div>
      </div>
    );
  }
}