import { useMemo, useState, useEffect, Fragment } from "react";
import { LinkOutlined } from "@ant-design/icons";
import { Button, Tabs, Table, Tag } from "antd";
import MonoConnect from "@mono.co/connect.js";
import "./App.css";

function App() {
  const [assetData, setAssetData] = useState({});
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earningsData, setEarningsData] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  const { VITE__API_ENDPOINT, VITE__PUBLIC_KEY, VITE__SECRET_KEY } = import.meta
    .env;

  const id = localStorage.id;

  useEffect(() => {
    // WHENEVER PAGE REFRESH, CHECK IF ACCOUNT ID EXIST
    // IF IT EXISTS, FETCH LATEST DATA FROM ASSETS AND EARNINGS ENDPOINT
    if (id) {
      getAssetData(id);
      getEarningsData(id);
    }
  }, []);

  const monoConnect = useMemo(() => {
    const monoInstance = new MonoConnect({
      onClose: () => console.log("Widget closed"),
      onLoad: () => console.log("Widget loaded successfully"),
      onSuccess: ({ code }) => {
        const options = {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "mono-sec-key": VITE__SECRET_KEY,
          },
          body: JSON.stringify({ code }),
        };
        fetch(`${VITE__API_ENDPOINT}/account/auth`, options)
          .then((response) => response.json())
          .then((response) => {
            localStorage.setItem("id", response?.id);
            getAssetData(response?.id);
            getEarningsData(response?.id);
            getAccountInfo(response?.id);
          })
          .catch((err) => console.log(err));
      },

      key: VITE__PUBLIC_KEY,
    });

    monoInstance.setup();

    return monoInstance;
  }, []);

  const getAccountInfo = (_id) => {
    const options = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "mono-sec-key": VITE__SECRET_KEY,
      },
    };
    fetch(`${VITE__API_ENDPOINT}/accounts/${_id}`, options)
      .then((response) => response.json())
      .then((response) => {
        const new_account = {};
        new_account.name = response.account.name;
        new_account.company = response.account.institution.name;

        // STORE SUCCESSFULLY LINKED ACCOUNTS IN LOCAL STORAGE
        setLinkedAccounts((prev) => {
          localStorage.setItem(
            "linked_accounts",
            JSON.stringify([...prev, new_account])
          );
          return [...prev, new_account];
        });
      })
      .catch((err) => console.log(err));
  };

  const getAssetData = (_id) => {
    const options = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "mono-sec-key": VITE__SECRET_KEY,
      },
    };
    fetch(`${VITE__API_ENDPOINT}/accounts/${_id}/assets`, options)
      .then((response) => response.json())
      .then((response) => {
        let total = 0;
        response.assets.map((item) => {
          const purchase_amt = (item.cost / 100) * item.quantity;
          total += purchase_amt;
          setTotalPurchaseAmount(total);
        });
        setAssetData(response);
      })
      .catch((err) => console.log(err));
  };

  const getEarningsData = (_id) => {
    const options = {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "mono-sec-key": VITE__SECRET_KEY,
      },
    };
    fetch(`${VITE__API_ENDPOINT}/accounts/${_id}/earnings`, options)
      .then((response) => response.json())
      .then((response) => {
        let total = 0;
        response.map((item) => {
          total += item.amount / 100;
          setTotalEarnings(total);
        });
        setEarningsData(response);
      })
      .catch((err) => console.log(err));
  };

  // TABS
  const items = [
    {
      key: "1",
      label: "Assets",
      children: <Assets data={assetData} />,
    },
    {
      key: "2",
      label: "Earnings",
      children: <Earnings data={earningsData} />,
    },
    {
      key: "3",
      label: "Total",
      children: (
        <Total
          totalPurchaseAmount={totalPurchaseAmount}
          totalEarnings={totalEarnings}
        />
      ),
    },
  ];

  const tableColumns = [
    {
      title: "Customer Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Account Linked",
      dataIndex: "account",
      key: "account",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Tag key={record.account} className="unlink">
            Unlink Account
          </Tag>
        );
      },
    },
  ];

  const tableDataStorage =
    localStorage.linked_accounts && JSON.parse(localStorage.linked_accounts);

  const tableData = tableDataStorage?.map((item, i) => {
    return {
      key: String(i + 1),
      name: item.name,
      account: item.company,
      date_linked: "February 17, 2023",
    };
  });

  return (
    <div className="container mt-100">
      <h1>Investy</h1>
      <hr />
      <br />
      <br />
      <div className="row">
        <div className="left">
          <p>
            Our Assets API Endpoint provides all assets that a connected
            customer currently holds in their various investment accounts.
            Information such as the name of the asset, the type e.g stock, the
            cost, the returns currency, symbol, price etc are all returned.
          </p>
          <Button
            onClick={() => monoConnect.open()}
            type="primary"
            icon={<LinkOutlined />}
            size="large"
            className="btn"
          >
            Link Account with Mono
          </Button>
          <br />
          <br />
          <br />
          <br />
          <Table
            columns={tableColumns}
            dataSource={tableData}
            pagination={false}
          />
        </div>
        <div className="right">
          <div className="card">
            <Tabs defaultActiveKey="1" items={items} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ASSETS TAB
const Assets = ({ data }) => {
  return (
    <>
      <div className="box">
        {data?.assets?.map((item, i) => {
          const purchase_amt = (item.cost / 100) * item.quantity;
          return (
            <Fragment key={i}>
              <li>
                <span>Name: </span> {item.name}
              </li>
              <li>
                <span>Type: </span> {item.type}
              </li>
              <li>
                <span>Cost: </span> {(item.cost / 100)?.toLocaleString()}
              </li>
              <li>
                <span>Return: </span> {item.return?.toLocaleString()}
              </li>
              <li>
                <span>Quantity: </span> {item.quantity}
              </li>
              <li>
                <span>Currency: </span> {item.currency}
              </li>
              <hr className="hr2" />
              <div className="details">
                {/* <li>
                  <span>Symbol: </span> {item.details.symbol}
                </li>
                <li>
                  <span>Price: </span> {item.details.price?.toLocaleString()}
                </li> */}
                <li>
                  <span>Purchase Amount: </span>{" "}
                  {purchase_amt?.toLocaleString()}
                </li>
              </div>

              <hr className="hr3" />
            </Fragment>
          );
        }) ||
          (!data.length && <h3>No Data!</h3>)}
      </div>
    </>
  );
};

// EARNINGS TAB
const Earnings = ({ data }) => {
  return (
    <>
      <div className="box">
        {(data.length &&
          data?.map((item, i) => (
            <Fragment key={i}>
              <li>
                <span>Amount: </span> {(item.amount / 100)?.toLocaleString()}
              </li>
              <li>
                <span>Narration: </span> {item.narration}
              </li>
              <li>
                <span>Date: </span> {item.date}
              </li>
              <hr className="hr2" />
              <div className="details">
                {/* <li>
                  <span>Symbol: </span> {item.asset.symbol || "N/A"}
                </li> */}
                <li>
                  <span>Name: </span> {item.asset.name}
                </li>
                <li>
                  <span>Price: </span>{" "}
                  {item.asset.sale_price?.toLocaleString() || "N/A"}
                </li>
                <li>
                  <span>Quantity Sold: </span>{" "}
                  {item.asset.quantity_sold || "N/A"}
                </li>
              </div>

              <hr className="hr3" />
            </Fragment>
          ))) ||
          (!data.length && <h3>No Data!</h3>)}
      </div>
    </>
  );
};

// TOTAL TAB
const Total = ({ totalPurchaseAmount, totalEarnings }) => {
  return (
    <div className="box">
      <h1>Assets</h1>
      <h3>
        Total Purchase Amount:
        <span> USD {totalPurchaseAmount?.toLocaleString()}</span>
      </h3>
      <br />
      <hr />
      <h1>Earnings</h1>
      <h3>
        Total Earnings: <span>{totalEarnings?.toLocaleString()}</span>
      </h3>
    </div>
  );
};

export default App;
