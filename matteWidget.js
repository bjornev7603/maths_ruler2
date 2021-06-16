//widget som demonstrerer oppgave der tall plasseres relativt på en tallinje
//GUI er bygd opp vha grafikkbiblioteket Konva. Stage -> Layer -> Text|Images|etc

//import axios from "axios";
export default class MatteWidget {
  //class MatteWidget {
  constructor(divElementId, config, answer = null, onAnswer, options) {
    var $_GET = {},
      //$_GET contains posted url query variables
      args = location.search.substr(1).split(/&/);
    for (var i = 0; i < args.length; ++i) {
      var tmp = args[i].split(/=/);
      if (tmp[0] != "") {
        $_GET[decodeURIComponent(tmp[0])] = decodeURIComponent(
          tmp.slice(1).join("").replace("+", " ")
        );
      }
    }
    if (localStorage.getItem("tasknr") == "null") {
      localStorage.setItem("tasknr", "0");
    }

    document.getElementById("widget-container").style.display = "none";

    //pressed button to start tasks
    document.querySelector("#start_task_btn").addEventListener("click", () => {
      //alert("Starte oppgaver");
      document.getElementById("widget-container").style.display = "block";
      document.getElementById("nameinput").style.display = "none";
    });

    //show if content
    if ($_GET.drag_number == "" || $_GET.drag_number == undefined)
      document.getElementById("widget-container").style.display = "none";

    // //get movable number(s) from $_GET variable
    // this.drag_number =
    //   $_GET.drag_number != undefined && $_GET.drag_number != ""
    //     ? $_GET.drag_number
    //     : 5;
    // document.getElementById("drag_number").value = this.drag_number;

    // //get movable number(s) from $_GET variable
    // this.anchor_number1 =
    //   $_GET.anchor_number1 != undefined && $_GET.anchor_number1 != ""
    //     ? $_GET.anchor_number1
    //     : 3;
    // document.getElementById("anchor_number1").value = this.anchor_number1;

    // //get movable number(s) from $_GET variable
    // this.anchor_number2 =
    //   $_GET.anchor_number2 != undefined && $_GET.anchor_number2 != ""
    //     ? $_GET.anchor_number2
    //     : 7;
    // document.getElementById("anchor_number2").value = this.anchor_number2;

    // //get scale start from $_GET variable
    // this.Scale_from =
    //   $_GET.Scale_from != undefined && $_GET.Scale_from != ""
    //     ? $_GET.Scale_from
    //     : 0;
    // document.getElementById("Scale_from").value = this.Scale_from;

    // //get scale end from $_GET variable
    // this.Scale_to =
    //   $_GET.Scale_to != undefined && $_GET.Scale_to != "" ? $_GET.Scale_to : 10;
    // document.getElementById("Scale_to").value = this.Scale_to;

    // //get test name from $_GET variable
    // this.test_name =
    //   $_GET.test_name != undefined && $_GET.test_name != ""
    //     ? $_GET.test_name
    //     : "";
    // document.getElementById("test_name").value = this.test_name.replaceAll(
    //   "+",
    //   " "
    // );

    // //get test description from $_GET variable
    // this.test_desc =
    //   $_GET.test_desc != undefined && $_GET.test_desc != ""
    //     ? $_GET.test_desc
    //     : "";
    // document.getElementById("test_desc").value = this.test_desc.replaceAll(
    //   "+",
    //   " "
    // );

    // if ($_GET.name_mandatory != undefined && $_GET.name_mandatory != "") {
    //   this.name_mandatory = $_GET.name_mandatory;
    //   document.getElementById("name_mandatory").checked = "on";
    // }

    // if ($_GET.order_random != undefined && $_GET.order_random != "") {
    //   this.order_random = $_GET.order_random;
    //   document.getElementById("order_random").checked = "on";
    // }

    //cut the ruler's arrows, place number on the ruler line between arrows, then find the number relative distance in the given scale.
    this.r_offset_start = 30;
    this.r_offset_end = 30;

    //ruler x and y and width/length (global attributes ruler object - not ideal)
    this.ruler_x = 50;
    this.ruler_y = 500;
    this.ruler_width = 750;
    //let w_this = this;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    //width of "canvas"
    document.getElementById("nameinput").style =
      "width=600px;text-align: left; border: solid 1px";

    let testitems = this.getTestItems(this);
    console.log(`GET: Here's the list of tests`, testitems);
  }

  async mounted() {
    let that = this;
    try {
      const response = await axios.get("http://localhost:1337/tests");
      that.allTests = response.data;
    } catch (error) {
      this.error = error;
    }
  }

  async saveAttemptToBackend() {
    //let that = this;
    let xx = this.modifiedData_attempts.Numbers_solved.split(";");

    xx.sort();
    for (let j = 0; j < xx.length; j++) {
      xx[j] = xx[j].substring(xx[j].indexOf("|") + 1);
    }
    let str_xx = xx.join(";");
    this.modifiedData_attempts.Numbers_solved = str_xx;

    try {
      const response = await axios.post(
        "http://localhost:1337/attempts",
        this.modifiedData_attempts
      );

      console.log(response);
    } catch (error) {
      this.error = error;
    }
    window.location.reload();
  }

  //************************ */
  //Build number ruler GUI, with test set data from backend
  async getTestItems(t) {
    let z_this = t;
    try {
      const response = await axios.get("http://localhost:1337/tests");
      const testItems = response.data;

      //temp solution: fetch first and only test [0]
      let test = testItems[0];
      //console.log(test);

      //show name field if name input is required for test ("Enter_tester_name" is checked in backend)
      document.getElementById("div_testperson").style.display =
        test.Enter_tester_name === true ? "block" : "none";

      //show tasks in random order if test has this setting ("Order_random" is checked in backend)
      let random_order = test.Order_random === true ? true : false;
      console.log(random_order);

      //********************** */
      //Build GUI using KONVA
      var stage = new Konva.Stage({
        container: "widget-container",
        width: this.width,
        height: this.height,
      });
      var layer = new Konva.Layer();
      const ruler_group = new Konva.Group();

      var label_name = new Konva.Text({
        x: 275,
        y: 10,
        text: test.Testname,
        //text: w_this.test_name.replaceAll("+", " "),
        fontSize: 14,
        fontFamily: "Calibri",
        fill: "black",
      });

      var label_desc = new Konva.Text({
        x: 275,
        y: 60,
        width: 300,
        text: test.Description,
        //text: w_this.test_desc.replaceAll("+", " "),
        fontSize: 16,
        fontFamily: "Calibri",
        fill: "black",
      });

      var nextbutton = new Konva.Label({
        x: 666,
        y: 20,
        opacity: 0.75,
      });
      layer.add(nextbutton);

      nextbutton.add(
        new Konva.Tag({
          fill: "blue",
          lineJoin: "round",
          shadowColor: "black",
          shadowBlur: 10,
          shadowOffset: 10,
          shadowOpacity: 0.5,
        })
      );

      nextbutton.add(
        new Konva.Text({
          text: "Neste",
          fontFamily: "Calibri",
          fontSize: 18,
          padding: 5,
          fill: "white",
        })
      );

      //******************* */
      //Clicked "Next" button
      //******************* */
      nextbutton.on("click", () => {
        localStorage.setItem(
          "tasknr",
          parseInt(localStorage.getItem("tasknr")) + 1
        );
        if (parseInt(localStorage.getItem("tasknr")) >= test.tasks.length) {
          alert("Takk for at du har løst oppgavene!");
        }
        //alert("Neste oppgavenr er " + localStorage.getItem("tasknr"));
        if (document.getElementById("testperson").value != "") {
          localStorage.setItem(
            "username",
            document.getElementById("testperson").value
          );
        }

        z_this.saveAttemptToBackend();
      });

      //If beyond last task, start opening name input screen and reset task_nr
      if (parseInt(localStorage.getItem("tasknr")) >= test.tasks.length) {
        document.getElementById("widget-container").style.display = "none";
        document.getElementById("nameinput").style.display = "block";
        localStorage.setItem("tasknr", 0);
      }

      let taskid = parseInt(localStorage.getItem("tasknr"));

      //Check if there is a task after the current one
      //if no following task, show "Ferdig" button and end test
      if (parseInt(localStorage.getItem("tasknr")) < test.tasks.length - 1) {
        nextbutton.children[1].setAttr("text", "Neste oppgave");
      } else {
        nextbutton.children[1].setAttr("text", "Avslutt");
      }

      //populate object for saving attempt each time user clicks "Neste" or "Ferdig" button
      this.modifiedData_attempts = {
        Taskname: test.tasks[taskid].Taskname,
        Testname: test.Testname,
        Username: localStorage.getItem("username"),
        Numbers: test.tasks[taskid].Num_dyna,
        Numbers_solved: "",
        Time_spent: "124",
      };

      //layer.draw();

      var imageObj = new Image();
      imageObj.onload = function () {
        let ruler_img = new Konva.Image({
          x: z_this.ruler_x,
          y: z_this.ruler_y,
          image: imageObj,
          width: z_this.ruler_width,
        });
        // add the shape to the layer
        ruler_group.add(ruler_img);
        layer.batchDraw();
      };
      imageObj.src = "./img/arrow.png";

      if (parseInt(localStorage.getItem("tasknr")) > 0) {
        document.getElementById("widget-container").style.display = "block";
        document.getElementById("nameinput").style.display = "none";
      }

      let scale_from = test.tasks[taskid].Scale_from;
      let scale_to = test.tasks[taskid].Scale_to;
      scale_from = scale_from.includes("/") ? eval(scale_from) : scale_from;
      scale_to = scale_to.includes("/") ? eval(scale_to) : scale_to;
      //movable numbers
      let mov_nums = test.tasks[taskid].Num_dyna.split(/;/);
      for (var i = 0; i < mov_nums.length; ++i) {
        this.ii = i;
        let x_num_coor = this.ruler_x + this.ruler_width;
        switch (i) {
          case 0:
            x_num_coor /= 5;
            break;
          case 1:
            x_num_coor /= 2;
            break;
          case 2:
            x_num_coor /= 1.25;
            break;
          default:
            x_num_coor /= 2;
        }

        var drag_number = new Konva.Text({
          x: x_num_coor,
          y: 250,
          text: mov_nums[i],
          i_txt: this.ii,
          fontSize: 70,
          fontFamily: "Calibri",
          fill: "brown",
          Draggable: true,
        });

        z_this.modifiedData_attempts.Numbers_solved +=
          i != 0 ? ";" + i + "|" + "none" : i + "|" + "none";

        //event handlers for moving object
        drag_number.on("mouseover", function () {
          document.body.style.cursor = "pointer";
        });
        drag_number.on("mouseout", function () {
          document.body.style.cursor = "default";
        });

        drag_number.on("dragstart", function () {
          document.body.style.cursor = "default";
        });

        drag_number.on("dragend", function (e) {
          console.log(e);
          document.body.style.cursor = "default";

          // to align text in the middle of the screen, we can set the
          // shape offset to the center of the text shape after instantiating it
          //drag_number.offsetX(drag_number.width() / 2);

          let ruler = ruler_group.children[0];
          //calculate relative position of number out on ruler
          // scale-start +
          //  (difference from scale-start to scale-end)
          //  *
          //  position-of-number - startposition-ruler - [offset-at-start]
          //  /
          //  width-of-ruler - startposition-ruler - [offset-at-end]
          let fraction =
            eval(scale_from) +
            ((scale_to - scale_from) *
              (this.x() - ruler.x() - z_this.r_offset_start)) /
              (ruler.width() - ruler.x() - z_this.r_offset_end);

          //if number is put beyond scale end, it gets the scale end position
          if (fraction > scale_to) fraction = scale_to;
          //if number is put before scale start, it gets the scale start position
          if (fraction < scale_from) fraction = scale_from;

          let numb = "";
          //if number hitting ruler area
          if (
            this.y() < z_this.ruler_y + 50 &&
            this.y() > z_this.ruler_y - 20
          ) {
            alert(
              "Posisjonen til tallet " +
                //this.text().split("|")[0] +
                this.text() +
                " er " +
                eval(fraction).toFixed(2) +
                //fraction +
                " på en skala fra " +
                scale_from +
                " til " +
                scale_to
            );

            numb = z_this.modifiedData_attempts.Numbers_solved;
            if (this.attrs.i_txt != "undefined") {
              let numb_ar =
                z_this.modifiedData_attempts.Numbers_solved.split(";");

              z_this.removeItem(numb_ar, this.attrs.i_txt + "|");

              numb = numb_ar.join(";");
            }

            z_this.modifiedData_attempts.Numbers_solved =
              numb == "" || numb == "null"
                ? numb + this.attrs.i_txt + "|" + eval(fraction).toFixed(2)
                : numb +
                  ";" +
                  this.attrs.i_txt +
                  "|" +
                  eval(fraction).toFixed(2);

            console.log("yes");
          } else {
            numb = z_this.modifiedData_attempts.Numbers_solved;
            if (this.attrs.i_txt != "undefined") {
              z_this.modifiedData_attempts.Numbers_solved =
                numb == "" || numb == "null"
                  ? numb + this.attrs.i_txt + "|" + "none"
                  : numb + ";" + this.attrs.i_txt + "|" + "none";
            }
          }
        });

        layer.add(drag_number);
        drag_number.zIndex(1);
      }

      let anchor_nums = test.tasks[taskid].Num_static.split(/;/);
      for (var i = 0; i < anchor_nums.length; ++i) {
        let anchor = anchor_nums[i];
        anchor = anchor.includes("/") ? eval(anchor) : anchor;
        let brok = (anchor - scale_from) / (scale_to - scale_from);
        brok =
          brok *
          (this.ruler_width -
            z_this.r_offset_end -
            (this.ruler_x + z_this.r_offset_start));
        brok = brok + this.ruler_x + z_this.r_offset_start;

        var anchor_number = new Konva.Text({
          //x: (this.ruler_x + this.ruler_width) / (i + 1.5),
          x: brok,
          y: this.ruler_y + 10,
          text: anchor_nums[i],
          //text: w_this.anchor_number,
          fontSize: 70,
          fontFamily: "Calibri",
          fill: "gray",
          Draggable: false,
        });
        layer.add(anchor_number);
        anchor_number.zIndex(1);
      }

      var label_scalestart = new Konva.Text({
        x: this.ruler_x + 20,
        y: this.ruler_y + 90,
        text: test.tasks[taskid].Scale_from,
        //text: w_this.Scale_from,
        fontSize: 30,
        fontFamily: "Calibri",
        fill: "black",
      });
      var label_scaleend = new Konva.Text({
        x: this.ruler_x + this.ruler_width - 40,
        y: this.ruler_y + 90,
        text: test.tasks[taskid].Scale_to,
        fontSize: 30,
        fontFamily: "Calibri",
        fill: "black",
      });

      // add the shape to the layer

      layer.add(label_scalestart);
      layer.add(label_scaleend);
      layer.add(label_name);
      layer.add(label_desc);
      label_desc.zIndex(1);
      //layer.add(button_next);

      // add the rect shape to the ruler group
      layer.add(ruler_group);
      ruler_group.zIndex(0);

      // add the layer to the stage
      stage.add(layer);

      return testItems;
    } catch (errors) {
      console.error(errors);
    }
  }

  async removeItem(array, item) {
    for (var i in array) {
      if (array[i].includes(item)) {
        array.splice(i, 1);
        break;
      }
    }
  }
}
