import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { Checkbox } from "primereact/checkbox";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

type Artwork = {
  id: string;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: string;
  date_end: string;
};

type Pagination = {
  current_page: number;
  total_pages: number;
  limit: number;
};
type StateType = {
  allSelected: boolean;
  states: Record<string, CheckBoxType>;
};
type CheckBoxType = Record<string, boolean>;

type SelectMultipleType = {
  count: number;
  pageNo: number;
};

function App() {
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 0,
    limit: 12,
  });
  const [data, setData] = useState<Artwork[]>([]);
  const [selectMultiple, setSelectMultiple] = useState<SelectMultipleType>({
    count: 0,
    pageNo: 0,
  });
  const overlayPanelRef = useRef<OverlayPanel>(null);
  const [boxStates, setBoxStates] = useState<StateType>({
    allSelected: false,
    states: {},
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${pagination.current_page}`
      );
      const json = await response.json();
      setData(json.data);
      setPagination((prev) => ({
        ...prev,
        limit: json.pagination.limit,
        total_pages: json.pagination.total_pages,
        current_page: json.pagination.current_page,
      }));

      setBoxStates((prev) => {
        let updatedStates = { ...prev.states[pagination.current_page] };

        if (selectMultiple.pageNo === pagination.current_page) {
          let num = selectMultiple.count;
          let i = 0;

          while (num > 0 && i < json.data.length) {
            const id = json.data[i].id;
            updatedStates[id] = true;
            num--;
            i++;
          }
          setSelectMultiple((previous) => ({
            ...previous,
            count: previous.count - i,
            pageNo: previous.pageNo + 1,
          }));
          return {
            ...prev,
            states: {
              ...prev.states,
              [pagination.current_page]: updatedStates,
            },
          };
        }
        return prev;
      });
    };

    fetchData();
  }, [pagination.current_page]);

  useEffect(() => {
    setIsAllSelected();
  }, [boxStates.states, pagination.current_page]);

  const setIsAllSelected = () => {
    const currentPageState = boxStates.states[pagination.current_page];
    if (!(`${pagination.current_page}` in boxStates.states)) {
      setBoxStates((prev) => ({ ...prev, allSelected: false }));
      return;
    }
    const isAllSelected = Object.values(currentPageState).every(
      (value) => value === true
    );
    setBoxStates((prev) => ({ ...prev, allSelected: isAllSelected }));
  };

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setPagination({ ...pagination, current_page: event.page + 1 });
  };

  const onCheckboxChange = useCallback(
    (e: any, id: string) => {
      const checked = e.checked;
      const currentPageState = boxStates.states[pagination.current_page] || {};
      const updatedPageState = { ...currentPageState, [id]: checked };

      setBoxStates((prev) => ({
        ...prev,
        states: { ...prev.states, [pagination.current_page]: updatedPageState },
      }));

      setIsAllSelected();
    },
    [boxStates.states, pagination.current_page, setIsAllSelected]
  );

  const onSelectAllChange = (e: any) => {
    const checked = e.checked;
    const updatedState = data.reduce(
      (acc, item) => ({ ...acc, [item.id]: checked }),
      {}
    );

    setBoxStates((prev) => ({
      ...prev,
      states: { ...prev.states, [pagination.current_page]: updatedState },
      allSelected: checked,
    }));
  };

  const onSvgClick = (event: any) => {
    overlayPanelRef.current?.toggle(event);
  };
  const applySelectMultiple = () => {
    setSelectMultiple((prev) => {
      let num = prev.count;
      console.log(num + "is input");
      let i = 0;
      let updatedStates = { ...boxStates.states[pagination.current_page] };

      while (num > 0 && i < data.length) {
        const id = data[i].id;
        updatedStates[id] = true;
        i++;
        num--;
      }
      setBoxStates((prev) => ({
        ...prev,
        states: { ...prev.states, [pagination.current_page]: updatedStates },
      }));
      if (prev.count <= 12) {
        setBoxStates((prevBoxStates) => ({
          ...prevBoxStates,
          states: {
            ...prevBoxStates.states,
            [pagination.current_page]: updatedStates,
          },
        }));
        return {
          ...prev,
          count: 0,
          pageNo: prev.pageNo + 1,
        };
      } else {
        const nextPage = pagination.current_page + 1;
        console.log(nextPage + " is nextpage");
        return {
          ...prev,
          count: prev.count - i,
          pageNo: nextPage,
        };
      }
    });

    overlayPanelRef.current?.hide();
  };

  return (
    <div className="card">
      <OverlayPanel ref={overlayPanelRef}>
        <div className="p-3">
          <h5>Select Multiple</h5>
          <InputNumber
            value={selectMultiple.count}
            onValueChange={(e) =>
              setSelectMultiple((prev) => ({
                ...prev,
                count: e.target.value || 0,
              }))
            }
          />
          <Button label="Apply" onClick={applySelectMultiple} />
        </div>
      </OverlayPanel>

      <DataTable value={data} tableStyle={{ minWidth: "50rem" }}>
        <Column
          header={
            <div style={{ display: "flex" }}>
              <Checkbox
                onChange={onSelectAllChange}
                checked={boxStates.allSelected}
              />
              <svg
                onClick={onSvgClick}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                style={{ cursor: "pointer", marginLeft: "0.5rem" }}
                width="20"
                height="20"
              >
                <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
              </svg>
            </div>
          }
          body={(rowData: Artwork) => (
            <Checkbox
              onChange={(e) => onCheckboxChange(e, rowData.id)}
              checked={
                boxStates.states[pagination.current_page]?.[rowData.id] || false
              }
            />
          )}
        />
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Place Of Origin"></Column>
        <Column field="artist_display" header="Artist Display"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Date Start"></Column>
        <Column field="date_end" header="Date End"></Column>
      </DataTable>

      <Paginator
        first={(pagination.current_page - 1) * pagination.limit}
        rows={pagination.limit}
        totalRecords={pagination.total_pages * pagination.limit}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export default App;
