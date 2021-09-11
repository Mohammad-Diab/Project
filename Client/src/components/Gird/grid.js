import { useState, useEffect } from "react";

import GridPagination from "./pagination";
import DropDownFilter from "./dropDownFilter";
import { Table, Button } from "react-bootstrap";

import { filterField_enum } from "./../../shared/enum";
import request from "./../../shared/request";
import config from "./../../config.json";

import arrowUp from "./../../Assets/img/arrow-up.svg";
import arrowDown from "./../../Assets/img/arrow-down.svg";

function Grid(props) {
  let columnsArr = props.columns;
  let dataUrl = props.dataUrl;

  const [gridState, setGridState] = useState({
    data: null,
    isLoading: true,
    currentPage: 1,
    numberOfPages: 0,
    recordsCount: 0,
    filter: "",
    sortBy: 0,
  });

  let tableHeader = [];
  let tableFilter = [];
  let tableContent = [];
  let filterCount = 0;

  if (!gridState.isLoading) {
    for (let col of columnsArr) {
      tableHeader.push(
        col.Sortable ? (
          <th style={{ verticalAlign: "middle", width: col.width }} key={col.id}>
            <Button
              variant="link"
              className="py-0 text-dark"
              onClick={() => {
                debugger;
                readGridDate(
                  1,
                  gridState.filter,
                  gridState.sortBy == col.id ? col.id + 10 : col.id
                );
              }}
            >
              {col.text}
              {gridState.sortBy == col.id ? (
                <img alt="arrow up" src={arrowUp} className="ml-2" />
              ) : gridState.sortBy == col.id + 10 ? (
                <img alt="arrow down" src={arrowDown} className="ml-2" />
              ) : (
                ""
              )}
            </Button>
          </th>
        ) : (
          <th
            key={col.id}
            style={{ verticalAlign: "middle", width: col.width }}
          >
            {col.text}
          </th>
        )
      );
      if (col.filterable) {
        filterCount++;

        let filterElement = buildColumnFilter(col, (filter) => {
          debugger;
          filter = filter ? encodeURIComponent(filter) : "";
          readGridDate(1, filter, gridState.sortBy);
        });
        tableFilter.push(
          <td key={`${col.id}-filter`} className="p-0">
            {filterElement}
          </td>
        );
        //});
      } else {
        tableFilter.push(<td key={`${col.id}-filter`} className="p-0" />);
      }
    }
  }

  if (gridState.isLoading) {
    tableContent.push(
      <tr>
        <td colSpan={columnsArr.length}>Loading...</td>
      </tr>
    );
  } else if (gridState.data) {
    let startIndex = (gridState.currentPage - 1) * config.rowPerPage + 1;
    tableContent = gridState.data.map((row, index) => (
      <tr key={row.id}>
        {columnsArr.map((it) => {
          let className = it.id == -1 ? "text-center" : "";
          return (
            <td className={className} key={row.id + it.id}>
              {it.id == -1 ? index + startIndex : row[it.selector]}
            </td>
          );
        })}
      </tr>
    ));
  }

  //selector: 'region',

  function readGridDate(pageNumber, filter, sortBy) {
    filter = filter ? filter : "";
    let api = `${dataUrl}?pageNumber=${pageNumber}&filter=${filter}&sortBy=${sortBy}`;
    request.get(api).then((result) => {
      setGridState({
        isLoading: false,
        data: result.data,
        numberOfPages: result.numberOfPages,
        recordsCount: result.count,
        currentPage: pageNumber,
        filter: filter,
        sortBy: sortBy,
      });
    });
  }

  useEffect(() => readGridDate(1, "", 0), []);
  return (
    <>
      <div
        className="mb-2"
        style={{ height: "calc(100% - 3em)", overflow: "hidden auto" }}
      >
        <Table striped bordered hover className="mb-0">
          <thead>
            <tr className="text-center bg-light">{tableHeader}</tr>
            {filterCount ? <tr className="text-center bg-light">{tableFilter}</tr> : <></>}
          </thead>
          <tbody>
            {tableContent}
          </tbody>
        </Table>
      </div>
      <GridPagination
        goToPage={(page) =>
          readGridDate(page, gridState.filter, gridState.sortBy)
        }
        currentPage={gridState.currentPage}
        numberOfPages={gridState.numberOfPages}
        recordsCount={gridState.recordsCount}
      />
    </>
  );
}

function buildColumnFilter(column, filterGrid) {
  switch (column.filter.type) {
    case filterField_enum.dropdown:
      return (
        <DropDownFilter
          dateUrl={column.filter.dateUrl}
          filterGrid={filterGrid}
        />
      );
    default:
      break;
  }
}

export default Grid;
